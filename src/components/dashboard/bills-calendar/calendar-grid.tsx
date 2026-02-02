"use client";

import { WEEK_DAYS } from "./types";
import type { DayBills } from "./types";

interface CalendarGridProps {
  calendar: DayBills[];
  firstDayOfMonth: number;
  isCurrentMonth: boolean;
  onSelectDay: (day: DayBills | null) => void;
}

export function CalendarGrid({
  calendar,
  firstDayOfMonth,
  isCurrentMonth,
  onSelectDay,
}: CalendarGridProps) {
  return (
    <div className="p-3 sm:p-4">
      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-[var(--text-dimmed)] py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {calendar.map((day) => {
          const hasBills = day.bills.length > 0;
          const hasOverdue = day.bills.some((b) => b.isPastDue);
          const allPaid = hasBills && day.bills.every((b) => b.isPaid);
          const hasInvoice = day.bills.some((b) => b.type === "invoice");

          return (
            <button
              key={day.day}
              onClick={() => onSelectDay(day.bills.length > 0 ? day : null)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm transition-all relative ${
                day.isToday && isCurrentMonth
                  ? "bg-primary-gradient text-white font-bold"
                  : hasBills
                  ? hasOverdue
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : allPaid
                    ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  : day.isPast
                  ? "text-[var(--text-dimmed)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <span>{day.day}</span>
              {hasBills && (
                <div className="flex gap-0.5 mt-0.5">
                  {day.bills.slice(0, 3).map((bill, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        bill.type === "invoice"
                          ? "bg-blue-400"
                          : bill.isPastDue
                          ? "bg-red-400"
                          : bill.isPaid
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Credit card indicator */}
              {hasInvoice && !(day.isToday && isCurrentMonth) && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
