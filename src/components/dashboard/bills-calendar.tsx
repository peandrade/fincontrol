"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { usePreferences } from "@/contexts";
import {
  CalendarHeader,
  CashFlowView,
  CalendarGrid,
  SelectedDayDetails,
  InvoicesSummary,
  NextDueAlert,
  type BillsCalendarData,
  type DayBills,
} from "./bills-calendar/index";

export function BillsCalendar() {
  const now = new Date();
  const [data, setData] = useState<BillsCalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayBills | null>(null);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const { privacy, notifications } = usePreferences();

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const fetchData = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bills-calendar?month=${month}&year=${year}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erro ao buscar calendário:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(viewMonth, viewYear);
  }, [viewMonth, viewYear, fetchData]);

  const goToPrevMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setSelectedDay(null);
    setViewMonth(now.getMonth() + 1);
    setViewYear(now.getFullYear());
  };

  if (isLoading && !data) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[var(--text-dimmed)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!notifications.billReminders || !data) return null;

  const firstDayOfMonth = new Date(data.currentYear, data.currentMonth - 1, 1).getDay();
  const invoiceBills = data.bills.filter((b) => b.type === "invoice" && b.value > 0);

  // Calculate if next due alert should be shown
  const shouldShowNextDueAlert = (() => {
    if (!data.summary.nextDue || selectedDay || !isCurrentMonth) return false;
    const today = now.getDate();
    const daysUntilDue = data.summary.nextDue.day - today;
    return daysUntilDue >= 0 && daysUntilDue <= notifications.reminderDays;
  })();

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden h-full flex flex-col">
      <CalendarHeader
        data={data}
        isLoading={isLoading}
        showCashFlow={showCashFlow}
        hideValues={privacy.hideValues}
        onToggleCashFlow={() => setShowCashFlow(!showCashFlow)}
        onRefresh={() => fetchData(viewMonth, viewYear)}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onGoToToday={goToToday}
      />

      {showCashFlow ? (
        <CashFlowView
          projections={data.cashFlowProjection}
          hideValues={privacy.hideValues}
        />
      ) : (
        <>
          <CalendarGrid
            calendar={data.calendar}
            firstDayOfMonth={firstDayOfMonth}
            isCurrentMonth={isCurrentMonth}
            onSelectDay={setSelectedDay}
          />

          {selectedDay && (
            <SelectedDayDetails
              selectedDay={selectedDay}
              hideValues={privacy.hideValues}
              onClose={() => setSelectedDay(null)}
            />
          )}

          {!selectedDay && (
            <InvoicesSummary
              invoiceBills={invoiceBills}
              totalInvoices={data.summary.totalInvoices}
              hideValues={privacy.hideValues}
            />
          )}

          {shouldShowNextDueAlert && data.summary.nextDue && (
            <NextDueAlert
              nextDue={data.summary.nextDue}
              hideValues={privacy.hideValues}
            />
          )}
        </>
      )}
    </div>
  );
}
