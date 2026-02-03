export interface BillEvent {
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

export interface DayBills {
  day: number;
  date: string;
  bills: BillEvent[];
  total: number;
  isToday: boolean;
  isPast: boolean;
}

export interface CashFlowProjection {
  month: string;
  monthLabel: string;
  expectedIncome: number;
  expectedExpenses: number;
  recurringExpenses: number;
  cardInvoices: number;
  netFlow: number;
}

export interface BillsCalendarData {
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

// Re-export from centralized constants
export { MONTH_NAMES, DAY_NAMES_SHORT as WEEK_DAYS } from "@/lib/constants";
