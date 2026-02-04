import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateCardCache, invalidateTransactionCache } from "@/lib/api-utils";
import { updateInvoiceSchema, validateBody } from "@/lib/schemas";
import { invoiceRepository, transactionRepository, cardRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string; invoiceId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return PUT(request, { params });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id: cardId, invoiceId } = await params;
    const body = await req.json();

    const validation = validateBody(updateInvoiceSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    // Use repository for proper ownership check
    const card = await cardRepository.findById(cardId, session.user.id);

    if (!card) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
    }

    // Use repository for proper decryption of encrypted fields
    const currentInvoice = await invoiceRepository.findById(invoiceId, true);

    if (!currentInvoice) {
      return errorResponse("Fatura não encontrada", 404, "NOT_FOUND");
    }

    if (currentInvoice.creditCardId !== cardId) {
      return errorResponse("Fatura não pertence a este cartão", 400, "INVALID_REFERENCE");
    }

    const { status, paidAmount } = validation.data;
    const updateData: Partial<{ status: string; paidAmount: number }> = {};
    let paymentAmount = 0;

    // Values are already decrypted by repository
    const invoiceTotal = currentInvoice.total as unknown as number;
    const invoicePaidAmount = currentInvoice.paidAmount as unknown as number;

    if (status) {
      updateData.status = status;

      if (status === "paid") {
        paymentAmount = invoiceTotal - invoicePaidAmount;
        updateData.paidAmount = invoiceTotal;
      }
    }

    if (paidAmount !== undefined && paidAmount > invoicePaidAmount) {
      paymentAmount = paidAmount - invoicePaidAmount;
      updateData.paidAmount = paidAmount;
    }

    // Update invoice using repository
    const invoice = await invoiceRepository.update(invoiceId, updateData as Parameters<typeof invoiceRepository.update>[1]);

    // Fetch updated invoice with purchases for response
    const updatedInvoice = await invoiceRepository.findById(invoiceId, true);

    if (paymentAmount > 0) {
      const cardName = currentInvoice.creditCard?.name || "Cartão";
      const monthName = new Date(currentInvoice.year, currentInvoice.month - 1)
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

      // Create transaction using repository
      await transactionRepository.create({
        type: "expense",
        value: paymentAmount,
        category: "Fatura Cartão",
        description: `Fatura ${cardName} - ${monthName}`,
        date: new Date(),
        userId: session.user.id,
      });

      // Invalidate transaction cache since we created a transaction
      invalidateTransactionCache(session.user.id);
    }

    // Invalidate card cache for invoice update
    invalidateCardCache(session.user.id);

    return NextResponse.json(updatedInvoice);
  }, request);
}
