"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Zap, X } from "lucide-react";
import { FabActionPanel } from "./fab-action-panel";
import type { TransactionType, TransactionTemplate } from "@/types";

interface QuickActionButtonsProps {
  onQuickAdd: (type: TransactionType) => void;
  onUseTemplate: (template: TransactionTemplate) => void;
}

export function QuickActionButtons({ onQuickAdd, onUseTemplate }: QuickActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickAdd = (type: TransactionType) => {
    onQuickAdd(type);
    setIsExpanded(false);
  };

  const handleOpenTemplates = () => {
    setIsTemplatesOpen(true);
    setIsExpanded(false);
  };

  const handleUseTemplate = (template: TransactionTemplate) => {
    onUseTemplate(template);
    setIsTemplatesOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-30">
        {/* Receita — top */}
        <button
          onClick={() => handleQuickAdd("income")}
          className={`absolute bottom-0 right-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-90 transition-all duration-300 hover:scale-110 ${
            isExpanded
              ? "opacity-100 -translate-y-[72px] pointer-events-auto"
              : "opacity-0 translate-y-0 pointer-events-none scale-50"
          }`}
          title="Nova Receita"
        >
          <TrendingUp className="w-5 h-5" />
        </button>

        {/* Atalhos — diagonal */}
        <button
          onClick={handleOpenTemplates}
          className={`absolute bottom-0 right-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 active:scale-90 transition-all duration-300 hover:scale-110 ${
            isExpanded
              ? "opacity-100 -translate-y-[52px] -translate-x-[52px] pointer-events-auto"
              : "opacity-0 translate-y-0 translate-x-0 pointer-events-none scale-50"
          }`}
          title="Atalhos"
        >
          <Zap className="w-5 h-5" />
        </button>

        {/* Despesa — left */}
        <button
          onClick={() => handleQuickAdd("expense")}
          className={`absolute bottom-0 right-0 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 active:scale-90 transition-all duration-300 hover:scale-110 ${
            isExpanded
              ? "opacity-100 -translate-x-[72px] pointer-events-auto"
              : "opacity-0 translate-x-0 pointer-events-none scale-50"
          }`}
          title="Nova Despesa"
        >
          <TrendingDown className="w-5 h-5" />
        </button>

        {/* FAB */}
        <button
          onClick={handleToggle}
          className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
            isExpanded
              ? "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30"
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

      {/* Templates panel */}
      <FabActionPanel
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onUseTemplate={handleUseTemplate}
      />
    </>
  );
}
