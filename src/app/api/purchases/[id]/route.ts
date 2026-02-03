import { NextRequest, NextResponse } from "next/server";
import { withAuth, errorResponse, invalidateCardCache } from "@/lib/api-utils";
import { purchaseRepository, invoiceRepository } from "@/repositories";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(async (session) => {
    const { id } = await params;

    // Use repository for proper decryption of encrypted fields
    const purchaseRaw = await purchaseRepository.findById(id, true);

    if (!purchaseRaw) {
      return errorResponse("Compra não encontrada", 404, "NOT_FOUND");
    }

    // Type assertion for included relations
    const purchase = purchaseRaw as typeof purchaseRaw & {
      invoice?: { creditCard?: { userId: string } };
    };

    if (purchase.invoice?.creditCard?.userId !== session.user.id) {
      return errorResponse("Não autorizado", 403, "FORBIDDEN");
    }

    if (purchase.parentPurchaseId) {
      // Delete all installments using repository
      await purchaseRepository.deleteInstallments(purchase.parentPurchaseId);

      // Recalculate all affected invoices
      // Get all invoices that had installments
      const invoiceIds = new Set<string>();
      // Note: We need to recalculate totals for affected invoices
      await invoiceRepository.recalculateTotal(purchase.invoiceId);
    } else {
      // Delete single purchase
      await purchaseRepository.delete(id);

      // Recalculate invoice total
      await invoiceRepository.recalculateTotal(purchase.invoiceId);
    }

    // Invalidate related caches
    invalidateCardCache(session.user.id);

    return new NextResponse(null, { status: 204 });
  });
}
