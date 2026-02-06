"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { FeedbackModal } from "./feedback-modal";
import { useFab } from "@/contexts";
import { cn } from "@/lib/utils";

export function FeedbackButton() {
  const t = useTranslations("feedback");
  const [isOpen, setIsOpen] = useState(false);
  const { isExpanded: isFabExpanded } = useFab();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-40 p-3 rounded-full",
          "bg-primary-gradient shadow-lg shadow-primary",
          "hover:scale-105 active:scale-95 transition-all duration-300",
          // Mobile: above FAB area, moves up when FAB is expanded
          isFabExpanded ? "bottom-64" : "bottom-44",
          "right-5",
          // Desktop: above FAB area, moves up when FAB is expanded
          isFabExpanded ? "md:bottom-40" : "md:bottom-24",
          "md:right-6"
        )}
        aria-label={t("sendFeedback")}
        title={t("sendFeedback")}
      >
        <MessageSquarePlus className="w-5 h-5 text-white" />
      </button>

      <FeedbackModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
