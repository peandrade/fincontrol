import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCardCache, invalidateTransactionCache } from "@/lib/api-utils";
import { updateInvoiceSchema, validateBody } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ id: string; invoiceId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session, req) => {
    const { id: cardId, invoiceId } = await params;
    const body = await req.json();

    const validation = validateBody(updateInvoiceSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 422, "VALIDATION_ERROR", validation.details);
    }

    const card = await prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: session.user.id,
      },
    });

    if (!card) {
      return errorResponse("Cartão não encontrado", 404, "NOT_FOUND");
    }

    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { creditCard: true },
    });

    if (!currentInvoice) {
      return errorResponse("Fatura não encontrada", 404, "NOT_FOUND");
    }

    if (currentInvoice.creditCardId !== cardId) {
      return errorResponse("Fatura não pertence a este cartão", 400, "INVALID_REFERENCE");
    }

    const { status, paidAmount } = validation.data;
    const updateData: Record<string, unknown> = {};
    let paymentAmount = 0;

    if (status) {
      updateData.status = status;

      if (status === "paid") {
        paymentAmount = currentInvoice.total - currentInvoice.paidAmount;
        updateData.paidAmount = currentInvoice.total;
      }
    }

    if (paidAmount !== undefined && paidAmount > currentInvoice.paidAmount) {
      paymentAmount = paidAmount - currentInvoice.paidAmount;
      updateData.paidAmount = paidAmount;
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        purchases: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (paymentAmount > 0) {
      const cardName = currentInvoice.creditCard?.name || "Cartão";
      const monthName = new Date(currentInvoice.year, currentInvoice.month - 1)
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

      await prisma.transaction.create({
        data: {
          type: "expense",
          value: paymentAmount,
          category: "Fatura Cartão",
          description: `Fatura ${cardName} - ${monthName}`,
          date: new Date(),
          userId: session.user.id,
        },
      });

      // Invalidate transaction cache since we created a transaction
      invalidateTransactionCache(session.user.id);
    }

    // Invalidate card cache for invoice update
    invalidateCardCache(session.user.id);

    return NextResponse.json(invoice);
  }, request);
}
