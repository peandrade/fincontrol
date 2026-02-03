"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthName } from "@/lib/card-constants";
import type { Invoice } from "@/types/credit-card";

interface InvoiceSelectorProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  onSelectInvoice: (invoice: Invoice) => void;
}

export function InvoiceSelector({
  invoices,
  selectedInvoice,
  onSelectInvoice,
}: InvoiceSelectorProps) {
  if (invoices.length === 0) return null;

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const currentIndex = selectedInvoice
    ? sortedInvoices.findIndex((inv) => inv.id === selectedInvoice.id)
    : 0;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < sortedInvoices.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onSelectInvoice(sortedInvoices[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onSelectInvoice(sortedInvoices[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-5 h-5 text-gray-400" />
      </button>

      <div className="flex gap-1">
        {sortedInvoices.map((invoice) => {
          const isSelected = selectedInvoice?.id === invoice.id;
          const hasValue = invoice.total > 0;

          return (
            <button
              key={invoice.id}
              onClick={() => onSelectInvoice(invoice)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? "bg-[var(--color-primary)] text-white"
                  : hasValue
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white/5 text-gray-500 hover:bg-white/10"
              }`}
              title={`${getMonthName(invoice.month)} ${invoice.year}`}
            >
              {getMonthName(invoice.month).slice(0, 3)}/{String(invoice.year).slice(2)}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
}