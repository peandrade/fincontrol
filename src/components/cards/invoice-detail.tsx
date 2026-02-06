"use client";

import { useState } from "react";
import { Calendar, Check, Trash2, ShoppingBag, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import {
  formatMonthYear,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  getCategoryColor,
  getMonthName,
  getShortMonthName,
} from "@/lib/card-constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Invoice, Purchase } from "@/types/credit-card";

interface InvoiceDetailProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  cardName: string;
  cardColor: string;
  onSelectInvoice: (invoice: Invoice) => void;
  onPayInvoice: (invoiceId: string) => void;
  onDeletePurchase: (purchaseId: string) => void;
  isLoading: boolean;
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  borderWidth: "1px",
  borderStyle: "solid" as const,
  borderColor: "var(--border-color)"
};

export function InvoiceDetail({
  invoices,
  selectedInvoice,
  cardName,
  cardColor,
  onSelectInvoice,
  onPayInvoice,
  onDeletePurchase,
  isLoading,
}: InvoiceDetailProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<Purchase | null>(null);
  const { formatCurrency } = useCurrency();
  const { privacy, general } = usePreferences();
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");

  const handleDeleteClick = (purchase: Purchase) => {
    if (!general.confirmBeforeDelete) {
      onDeletePurchase(purchase.id);
      return;
    }
    setDeleteConfirm(purchase);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeletePurchase(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (!cardName) {
    return (
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300" style={cardStyle}>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: "var(--text-primary)" }}>{t("invoiceDetails")}</h3>
        <div className="text-center py-8 sm:py-12">
          <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3" style={{ color: "var(--text-dimmed)" }} />
          <p className="text-sm sm:text-base" style={{ color: "var(--text-dimmed)" }}>{t("selectCardToView")}</p>
        </div>
      </div>
    );
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const currentIndex = selectedInvoice
    ? sortedInvoices.findIndex((inv) => inv.id === selectedInvoice.id)
    : -1;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < sortedInvoices.length - 1;

  if (!selectedInvoice) {
    const now = new Date();
    return (
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300" style={cardStyle}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cardColor }} />
              <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{cardName}</h3>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{getMonthName(now.getMonth() + 1)} {now.getFullYear()}</p>
          </div>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-500/20 text-blue-400">
            {tc("open")}
          </span>
        </div>

        <div className="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6" style={{ backgroundColor: "var(--bg-hover)" }}>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{t("invoiceTotal")}</p>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{privacy.hideValues ? "•••••" : formatCurrency(0)}</p>
        </div>

        <div className="text-center py-6 sm:py-8">
          <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" style={{ color: "var(--text-dimmed)" }} />
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>{t("noEntriesCard")}</p>
          <p className="text-[10px] sm:text-xs mt-1" style={{ color: "var(--text-dimmed)" }}>{t("clickNewPurchase")}</p>
        </div>
      </div>
    );
  }

  const statusColor = getInvoiceStatusColor(selectedInvoice.status);
  const dueDate = new Date(selectedInvoice.dueDate);
  const isOverdue = selectedInvoice.status !== "paid" && dueDate < new Date();

  return (
    <div className="backdrop-blur rounded-2xl p-4 sm:p-6 transition-colors duration-300" style={cardStyle}>
      {}
      <div className="flex flex-col gap-4 mb-4 sm:mb-6">
        {}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cardColor }} />
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{cardName}</h3>
          </div>
          <span
            className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {isOverdue ? t("overdueInvoice") : getInvoiceStatusLabel(selectedInvoice.status)}
          </span>
        </div>

        {}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => canGoPrevious && onSelectInvoice(sortedInvoices[currentIndex - 1])}
            disabled={!canGoPrevious}
            className="p-1.5 sm:p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "var(--text-muted)" }} />
          </button>

          <div className="flex items-center gap-1 overflow-x-auto flex-1 pb-1 scrollbar-hide">
            {sortedInvoices.map((invoice) => {
              const isSelected = selectedInvoice?.id === invoice.id;
              const hasValue = invoice.total > 0;

              return (
                <button
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    isSelected
                      ? "bg-[var(--color-primary)] text-white"
                      : ""
                  }`}
                  style={!isSelected ? {
                    backgroundColor: hasValue ? "var(--bg-hover-strong)" : "var(--bg-hover)",
                    color: hasValue ? "var(--text-primary)" : "var(--text-dimmed)"
                  } : undefined}
                >
                  {getShortMonthName(invoice.month)}/{String(invoice.year).slice(2)}
                  {hasValue && !isSelected && (
                    <span className="ml-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full inline-block" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => canGoNext && onSelectInvoice(sortedInvoices[currentIndex + 1])}
            disabled={!canGoNext}
            className="p-1.5 sm:p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
      </div>

      {}
      <p className="mb-3 sm:mb-4 text-sm" style={{ color: "var(--text-muted)" }}>{formatMonthYear(selectedInvoice.month, selectedInvoice.year)}</p>

      {}
      <div className="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6" style={{ backgroundColor: "var(--bg-hover)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{t("invoiceTotal")}</p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{privacy.hideValues ? "•••••" : formatCurrency(selectedInvoice.total)}</p>
          </div>
          {selectedInvoice.status !== "paid" && selectedInvoice.total > 0 && (
            <button
              onClick={() => onPayInvoice(selectedInvoice.id)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl text-white text-sm sm:text-base font-medium transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              <Check className="w-4 h-4" />
              {t("payInvoice")}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "var(--text-dimmed)" }} />
            <span style={{ color: "var(--text-muted)" }}>
              {t("duesOn")} {dueDate.toLocaleDateString("pt-BR")}
            </span>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t("invoiceOverdue")}</span>
            </div>
          )}
        </div>
      </div>

      {}
      <div>
        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
          {t("entries")} ({selectedInvoice.purchases?.length || 0})
        </h4>

        {!selectedInvoice.purchases || selectedInvoice.purchases.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" style={{ color: "var(--text-dimmed)" }} />
            <p className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>{t("noEntriesInvoice")}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2">
            {selectedInvoice.purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all group gap-2"
                style={{ backgroundColor: "var(--bg-hover)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className="w-1.5 sm:w-2 h-8 sm:h-10 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(purchase.category) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>{purchase.description}</p>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs flex-wrap" style={{ color: "var(--text-dimmed)" }}>
                      <span className="truncate max-w-[60px] sm:max-w-none">{purchase.category}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{new Date(purchase.date).toLocaleDateString("pt-BR")}</span>
                      {purchase.installments > 1 && (
                        <>
                          <span>•</span>
                          <span className="text-primary-color">
                            {purchase.currentInstallment}/{purchase.installments}
                          </span>
                        </>
                      )}
                      {purchase.isRecurring && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline text-blue-400">{td("recurring")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <p className="font-medium text-xs sm:text-base" style={{ color: "var(--text-primary)" }}>{privacy.hideValues ? "•••••" : formatCurrency(purchase.value)}</p>
                  <button
                    onClick={() => handleDeleteClick(purchase)}
                    className="p-1.5 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={t("deletePurchase")}
        message={t("deletePurchaseConfirm", { description: deleteConfirm?.description || "" })}
        confirmText={tc("delete")}
      />
    </div>
  );
}
