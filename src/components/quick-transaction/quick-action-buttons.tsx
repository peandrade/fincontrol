"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, X } from "lucide-react";
import type { TransactionType } from "@/types";

interface QuickActionButtonsProps {
  onQuickAdd: (type: TransactionType) => void;
}

export function QuickActionButtons({ onQuickAdd }: QuickActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickAdd = (type: TransactionType) => {
    onQuickAdd(type);
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30">
      {}
      <div
        className={`absolute bottom-16 right-0 flex flex-col gap-2 sm:gap-3 transition-all duration-300 ${
          isExpanded
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {}
        <button
          onClick={() => handleQuickAdd("income")}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95 transition-all hover:scale-105"
        >
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium whitespace-nowrap text-sm sm:text-base">Nova Receita</span>
        </button>

        {}
        <button
          onClick={() => handleQuickAdd("expense")}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 active:scale-95 transition-all hover:scale-105"
        >
          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium whitespace-nowrap text-sm sm:text-base">Nova Despesa</span>
        </button>
      </div>

      {}
      <button
        onClick={handleToggle}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          isExpanded
            ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rotate-45"
            : "bg-primary-gradient shadow-primary"
        }`}
      >
        {isExpanded ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
      </button>
    </div>
  );
}
