"use client";

import { useState } from "react";
import { CreditCard as CardIcon, Trash2, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePreferences } from "@/contexts";
import { useCurrency } from "@/contexts/currency-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CreditCard } from "@/types/credit-card";

interface CardListProps {
  cards: CreditCard[];
  selectedCardId?: string | null;
  onSelectCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  deletingId?: string | null;
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  borderWidth: "1px",
  borderStyle: "solid" as const,
  borderColor: "var(--border-color)"
};

export function CardList({
  cards,
  selectedCardId,
  onSelectCard,
  onDeleteCard,
  deletingId,
}: CardListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<CreditCard | null>(null);
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const { formatCurrency } = useCurrency();
  const { privacy, general } = usePreferences();

  const handleDeleteClick = (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
    if (!general.confirmBeforeDelete) {
      onDeleteCard(card.id);
      return;
    }
    setDeleteConfirm(card);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteCard(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };
  if (cards.length === 0) {
    return (
      <div className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors duration-300" style={cardStyle}>
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: "var(--text-primary)" }}>{t("myCards")}</h3>
        <div className="text-center py-6 sm:py-8">
          <CardIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3" style={{ color: "var(--text-dimmed)" }} />
          <p className="text-sm sm:text-base" style={{ color: "var(--text-dimmed)" }}>{t("noCards")}</p>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-dimmed)" }}>
            {t("addFirstCard")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur rounded-2xl p-4 sm:p-6 transition-colors duration-300" style={cardStyle}>
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: "var(--text-primary)" }}>{t("myCards")}</h3>
      <div className="space-y-2 sm:space-y-3">
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;

          const usedLimit = card.invoices?.reduce((sum, inv) => {
            if (inv.status !== "paid") {
              return sum + (inv.total - (inv.paidAmount || 0));
            }
            return sum;
          }, 0) || 0;

          const sortedInvoices = [...(card.invoices || [])].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          });

          const nextInvoiceWithValue = sortedInvoices.find(
            (inv) => inv.total > 0 && inv.status !== "paid"
          );

          const displayInvoice = nextInvoiceWithValue || sortedInvoices[0];
          const displayTotal = displayInvoice?.total || 0;

          const usagePercent = card.limit > 0 ? (usedLimit / card.limit) * 100 : 0;

          return (
            <div
              key={card.id}
              onClick={() => onSelectCard(card)}
              className="p-3 sm:p-4 rounded-xl cursor-pointer transition-all group"
              style={{
                backgroundColor: isSelected ? "var(--bg-hover-strong)" : "var(--bg-hover)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: isSelected ? "var(--border-color-strong)" : "transparent"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-hover-strong)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  {}
                  <div
                    className="w-10 h-7 sm:w-12 sm:h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: card.color }}
                  >
                    <CardIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <p className="font-medium text-sm sm:text-base truncate" style={{ color: "var(--text-primary)" }}>{card.name}</p>
                      {card.lastDigits && (
                        <span className="text-xs sm:text-sm" style={{ color: "var(--text-dimmed)" }}>
                          •••• {card.lastDigits}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3 text-[10px] sm:text-sm">
                      <span style={{ color: "var(--text-dimmed)" }}>
                        {t("closes")} {card.closingDay}
                      </span>
                      <span style={{ color: "var(--text-dimmed)" }}>•</span>
                      <span style={{ color: "var(--text-dimmed)" }}>
                        {t("dueDate")} {card.dueDay}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
                      {privacy.hideValues ? "•••••" : formatCurrency(displayTotal)}
                    </p>
                    <p className="text-[10px] sm:text-sm hidden sm:block" style={{ color: "var(--text-dimmed)" }}>
                      {displayTotal > 0 && displayInvoice
                        ? `${t("invoiceLabel")} ${displayInvoice.month}/${displayInvoice.year}`
                        : t("currentInvoiceLabel")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={(e) => handleDeleteClick(e, card)}
                      disabled={deletingId === card.id}
                      className="p-1.5 sm:p-2 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all"
                      title={t("deleteCard")}
                      aria-label={t("deleteCard")}
                    >
                      {deletingId === card.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" aria-label={tc("deleting")} />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" aria-hidden="true" />
                      )}
                    </button>
                    <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                      isSelected ? "rotate-90" : ""
                    }`} style={{ color: "var(--text-dimmed)" }} aria-hidden="true" />
                  </div>
                </div>
              </div>

              {}
              {card.limit > 0 && (
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="flex justify-between text-[10px] sm:text-xs mb-1" style={{ color: "var(--text-dimmed)" }}>
                    <span>{t("limitLabel")} {privacy.hideValues ? "•••••" : formatCurrency(card.limit)}</span>
                    <span className={usagePercent > 80 ? "text-red-400" : usagePercent > 50 ? "text-yellow-400" : ""}>
                      {usagePercent.toFixed(0)}% {tc("used")}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1 sm:h-1.5" style={{ backgroundColor: "var(--bg-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(usagePercent, 100)}%`,
                        backgroundColor: usagePercent > 80
                          ? "#EF4444"
                          : usagePercent > 50
                            ? "#F59E0B"
                            : card.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteCard")}
        message={t("deleteCardConfirm", { name: deleteConfirm?.name || "" })}
        confirmText={tc("delete")}
        isLoading={!!deletingId}
      />
    </div>
  );
}
