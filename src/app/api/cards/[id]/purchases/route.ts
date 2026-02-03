import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";
import { createPurchaseSchema, validateBody } from "@/lib/schemas";
import { purchaseRepository, invoiceRepository, cardRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function calculateInvoiceMonth(
  purchaseDate: Date,
  closingDay: number,
  dueDay: number
): { month: number; year: number } {
  const day = purchaseDate.getDate();
  let closingMonth = purchaseDate.getMonth() + 1;
  let closingYear = purchaseDate.getFullYear();

  if (day > closingDay) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  let dueMonth = closingMonth;
  let dueYear = closingYear;
  if (dueDay <= closingDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  return { month: dueMonth, year: dueYear };
}

async function getOrCreateInvoice(
  creditCardId: string,
  month: number,
  year: number,
  closingDay: number,
  dueDay: number
) {
  const dueDate = new Date(year, month - 1, dueDay);

  let closingMonth = month;
  let closingYear = year;
  if (dueDay <= closingDay) {
    closingMonth -= 1;
    if (closingMonth < 1) {
      closingMonth = 12;
      closingYear -= 1;
    }
  }
  const closingDate = new Date(closingYear, closingMonth - 1, closingDay);

  // Use repository to find or create invoice with proper encryption
  return invoiceRepository.findOrCreate(creditCardId, month, year, closingDate, dueDate);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id: creditCardId } = await params;
    const body = await req.json();

    // Override cardId with the one from params
    const validation = validateBody(createPurchaseSchema, { ...body, cardId: creditCardId });
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const { description, value, category, date, installments } = validation.data;

    // Use repository for proper decryption
    const card = await cardRepository.findById(creditCardId, session.user.id);

    if (!card) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
    }

    // Get unpaid invoices using repository for proper decryption
    const unpaidInvoices = await invoiceRepository.findByCard(creditCardId, {
      status: ["open", "closed"],
    });

    const usedLimit = unpaidInvoices.reduce(
      (sum, inv) => sum + ((inv.total as unknown as number) - (inv.paidAmount as unknown as number)),
      0
    );
    const cardLimit = card.limit as unknown as number;
    const availableLimit = cardLimit - usedLimit;

    if (value > availableLimit) {
      return errorResponse(
        "Compra excede o limite disponível",
        400,
        "LIMIT_EXCEEDED"
      );
    }

    const dateParts = date.split("T")[0].split("-");
    const purchaseDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      12, 0, 0, 0
    );
    const installmentCount = installments || 1;
    const installmentValue = value / installmentCount;
    const parentPurchaseId = installmentCount > 1 ? `parent_${Date.now()}` : null;

    for (let i = 0; i < installmentCount; i++) {
      const installmentDate = new Date(purchaseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);

      const { month, year } = calculateInvoiceMonth(
        installmentDate,
        card.closingDay,
        card.dueDay
      );

      const invoice = await getOrCreateInvoice(
        creditCardId,
        month,
        year,
        card.closingDay,
        card.dueDay
      );

      // Create purchase using repository with proper encryption
      await purchaseRepository.create({
        invoiceId: invoice.id,
        description: installmentCount > 1
          ? `${description} (${i + 1}/${installmentCount})`
          : description,
        value: installmentValue,
        totalValue: value,
        category,
        date: purchaseDate,
        installments: installmentCount,
        currentInstallment: i + 1,
        isRecurring: false,
        parentPurchaseId: parentPurchaseId || undefined,
        notes: undefined,
      });

      // Recalculate invoice total
      await invoiceRepository.recalculateTotal(invoice.id);
    }

    // Use repository for proper decryption (card + invoices)
    const updatedCard = await cardRepository.findById(creditCardId, session.user.id, true);

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return NextResponse.json(
      {
        card: updatedCard,
        message: installmentCount > 1
          ? `Compra parcelada em ${installmentCount}x adicionada`
          : "Compra adicionada",
      },
      { status: 201 }
    );
  }, request);
}
