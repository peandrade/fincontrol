import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            creditCard: true,
          },
        },
      },
    });

    if (!purchase) {
      return errorResponse("Compra não encontrada", 404, "NOT_FOUND");
    }

    if (purchase.invoice.creditCard.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    if (purchase.parentPurchaseId) {
      const allInstallments = await prisma.purchase.findMany({
        where: { parentPurchaseId: purchase.parentPurchaseId },
      });

      for (const installment of allInstallments) {
        await prisma.invoice.update({
          where: { id: installment.invoiceId },
          data: {
            total: { decrement: installment.value },
          },
        });

        await prisma.purchase.delete({
          where: { id: installment.id },
        });
      }
    } else {
      await prisma.invoice.update({
        where: { id: purchase.invoiceId },
        data: {
          total: { decrement: purchase.value },
        },
      });

      await prisma.purchase.delete({
        where: { id },
      });
    }

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
