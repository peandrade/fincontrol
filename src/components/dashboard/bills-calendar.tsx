"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePreferences } from "@/contexts";
import { getCategoryColor } from "@/lib/constants";

interface BillEvent {
  id: string;
  type: "recurring" | "invoice";
  description: string;
  value: number;
  category: string;
  dueDate: string;
  day: number;
  isPaid: boolean;
  isPastDue: boolean;
  cardName?: string;
  cardColor?: string;
}

interface DayBills {
  day: number;
  date: string;
  bills: BillEvent[];
  total: number;
  isToday: boolean;
  isPast: boolean;
}

interface CashFlowProjection {
  month: string;
  monthLabel: string;
  expectedIncome: number;
  expectedExpenses: number;
  recurringExpenses: number;
  cardInvoices: number;
  netFlow: number;
}

interface BillsCalendarData {
  calendar: DayBills[];
  bills: BillEvent[];
  cashFlowProjection: CashFlowProjection[];
  summary: {
    totalBills: number;
    totalValue: number;
    totalPending: number;
    totalPaid: number;
    overdueCount: number;
    overdueValue: number;
    upcomingCount: number;
    upcomingValue: number;
    totalInvoices: number;
    invoiceCount: number;
    nextDue: BillEvent | null;
  };
  currentMonth: number;
  currentYear: number;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

  // Separate invoice bills for the faturas section
  const invoiceBills = data.bills.filter((b) => b.type === "invoice" && b.value > 0);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl sm:rounded-2xl border border-[var(--border-color)] overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="pt-4 px-4 pb-4 sm:pt-5 sm:px-6 sm:pb-5 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                Calendário de Contas
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCashFlow(!showCashFlow)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showCashFlow
                  ? "bg-blue-500 text-white"
                  : "bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="hidden sm:inline">Fluxo de Caixa</span>
              <TrendingUp className="w-4 h-4 sm:hidden" />
            </button>
            <button
              onClick={() => fetchData(viewMonth, viewYear)}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] hover:text-blue-400 transition-colors"
          >
            <span>{monthNames[data.currentMonth - 1]} {data.currentYear}</span>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {data.summary.overdueCount > 0 ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3 text-center">
              <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-[10px] sm:text-xs text-red-400">Atrasadas</p>
              <p className="text-xs sm:text-sm font-bold text-red-400">
                {privacy.hideValues ? "•••••" : formatCurrency(data.summary.overdueValue)}
              </p>
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-3 text-center">
              <CreditCard className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-[10px] sm:text-xs text-blue-400">Faturas</p>
              <p className="text-xs sm:text-sm font-bold text-blue-400">
                {privacy.hideValues ? "•••••" : formatCurrency(data.summary.totalInvoices)}
              </p>
            </div>
          )}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 sm:p-3 text-center">
            <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-[10px] sm:text-xs text-amber-400">A vencer</p>
            <p className="text-xs sm:text-sm font-bold text-amber-400">
              {privacy.hideValues ? "•••••" : formatCurrency(data.summary.upcomingValue)}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 sm:p-3 text-center">
            <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-[10px] sm:text-xs text-emerald-400">Pagas</p>
            <p className="text-xs sm:text-sm font-bold text-emerald-400">
              {privacy.hideValues ? "•••••" : formatCurrency(data.summary.totalPaid)}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar or Cash Flow */}
      {showCashFlow ? (
        <div className="p-4 sm:p-6">
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Projeção de Fluxo de Caixa
          </h4>
          <div className="space-y-3">
            {data.cashFlowProjection.map((projection) => (
              <div
                key={projection.month}
                className="bg-[var(--bg-hover)] rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                    {projection.monthLabel}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      projection.netFlow >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {projection.netFlow >= 0 ? "+" : ""}
                    {privacy.hideValues ? "•••••" : formatCurrency(projection.netFlow)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-dimmed)]">Receitas</span>
                    <span className="text-emerald-400">
                      {privacy.hideValues ? "•••••" : formatCurrency(projection.expectedIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-dimmed)]">Despesas</span>
                    <span className="text-red-400">
                      {privacy.hideValues ? "•••••" : formatCurrency(projection.expectedExpenses)}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        (projection.expectedIncome /
                          (projection.expectedIncome + projection.expectedExpenses || 1)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${Math.min(
                        (projection.expectedExpenses /
                          (projection.expectedIncome + projection.expectedExpenses || 1)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="p-3 sm:p-4">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
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
              {data.calendar.map((day) => {
                const hasBills = day.bills.length > 0;
                const hasOverdue = day.bills.some((b) => b.isPastDue);
                const allPaid = hasBills && day.bills.every((b) => b.isPaid);
                const hasInvoice = day.bills.some((b) => b.type === "invoice");

                return (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.bills.length > 0 ? day : null)}
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

          {/* Selected Day Details */}
          {selectedDay && (
            <div className="p-4 sm:p-6 border-t border-[var(--border-color)] bg-[var(--bg-hover)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Dia {selectedDay.day} - {privacy.hideValues ? "•••••" : formatCurrency(selectedDay.total)}
                </span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-[var(--text-dimmed)] hover:text-[var(--text-primary)]"
                >
                  Fechar
                </button>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {selectedDay.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      bill.isPastDue
                        ? "bg-red-500/10 border border-red-500/30"
                        : bill.isPaid
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : bill.type === "invoice"
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "bg-amber-500/10 border border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {bill.type === "invoice" ? (
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: bill.cardColor || "#8B5CF6" }}
                        >
                          <CreditCard className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium"
                          style={{ backgroundColor: `${getCategoryColor(bill.category)}20`, color: getCategoryColor(bill.category) }}
                        >
                          {bill.category.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {bill.description}
                        </p>
                        <p className="text-[10px] text-[var(--text-dimmed)]">
                          {bill.type === "invoice" ? "Fatura" : "Recorrente"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${
                        bill.isPastDue
                          ? "text-red-400"
                          : bill.isPaid
                          ? "text-emerald-400"
                          : bill.type === "invoice"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}>
                        {bill.value === 0
                          ? "—"
                          : privacy.hideValues
                          ? "•••••"
                          : formatCurrency(bill.value)}
                      </p>
                      <p className={`text-[10px] ${
                        bill.isPastDue
                          ? "text-red-400"
                          : bill.isPaid
                          ? "text-emerald-400"
                          : bill.type === "invoice"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}>
                        {bill.isPastDue
                          ? "Atrasada"
                          : bill.isPaid
                          ? "Paga"
                          : bill.value === 0
                          ? "Sem fatura"
                          : "Pendente"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Summary */}
          {invoiceBills.length > 0 && !selectedDay && (
            <div className="p-4 sm:p-6 border-t border-[var(--border-color)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
                Faturas do mês
              </p>
              <div className="space-y-2">
                {invoiceBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ backgroundColor: bill.cardColor || "#8B5CF6" }}
                      >
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-[var(--text-primary)]">
                        {bill.cardName}
                      </span>
                      <span className="text-[10px] text-[var(--text-dimmed)]">
                        dia {bill.day}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${
                      bill.isPaid ? "text-emerald-400" : bill.isPastDue ? "text-red-400" : "text-blue-400"
                    }`}>
                      {privacy.hideValues ? "•••••" : formatCurrency(bill.value)}
                    </span>
                  </div>
                ))}
                {invoiceBills.length > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Total faturas</span>
                    <span className="text-xs font-bold text-blue-400">
                      {privacy.hideValues ? "•••••" : formatCurrency(data.summary.totalInvoices)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Due Alert */}
          {data.summary.nextDue && !selectedDay && isCurrentMonth && (() => {
            const today = now.getDate();
            const daysUntilDue = data.summary.nextDue!.day - today;
            const withinWindow = daysUntilDue >= 0 && daysUntilDue <= notifications.reminderDays;
            if (!withinWindow) return null;
            return (
              <div className="p-4 sm:p-6 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-amber-400">Próximo vencimento</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {data.summary.nextDue!.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-amber-400">
                      {privacy.hideValues ? "•••••" : formatCurrency(data.summary.nextDue!.value)}
                    </p>
                    <p className="text-xs text-[var(--text-dimmed)]">
                      Dia {data.summary.nextDue!.day}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
