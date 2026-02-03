/**
 * Common DTOs
 *
 * Shared Data Transfer Objects used across multiple domains.
 */

// ============================================
// Pagination
// ============================================

/**
 * Standard pagination query parameters.
 */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

/**
 * Standard pagination response metadata.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================
// Date Range
// ============================================

/**
 * Date range query parameters.
 */
export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

/**
 * Period selection for analytics.
 */
export type PeriodQuery = "1w" | "1m" | "3m" | "6m" | "1y";

// ============================================
// Common Entities
// ============================================

/**
 * Category in API response.
 */
export interface CategoryResponse {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Template in API response.
 */
export interface TemplateResponse {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: "income" | "expense";
  value: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Budget in API response.
 */
export interface BudgetResponse {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  period: "monthly" | "fixed";
  createdAt: string;
}

/**
 * Recurring expense in API response.
 */
export interface RecurringExpenseResponse {
  id: string;
  name: string;
  value: number;
  category: string;
  dueDay: number;
  description: string | null;
  isActive: boolean;
  lastLaunchedAt: string | null;
  createdAt: string;
}

/**
 * Financial goal in API response.
 */
export interface GoalResponse {
  id: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  deadline: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  contributions?: GoalContributionResponse[];
}

/**
 * Goal contribution in API response.
 */
export interface GoalContributionResponse {
  id: string;
  goalId: string;
  value: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

// ============================================
// User & Settings
// ============================================

/**
 * User profile response.
 */
export interface UserProfileResponse {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

/**
 * User preferences response.
 */
export interface UserPreferencesResponse {
  general: {
    defaultPage: "dashboard" | "cards" | "investments";
    defaultPeriod: "week" | "month" | "quarter" | "year";
    defaultSort: "recent" | "oldest" | "highest" | "lowest";
    confirmBeforeDelete: boolean;
  };
  notifications: {
    budgetAlerts: boolean;
    budgetThreshold: number;
    billReminders: boolean;
    reminderDays: number;
    weeklyReport: boolean;
    monthlyReport: boolean;
    sounds: boolean;
    vibration: boolean;
  };
  privacy: {
    hideValues: boolean;
    autoLock: boolean;
    autoLockTime: number;
  };
}

// ============================================
// Success/Error Responses
// ============================================

/**
 * Standard success response.
 */
export interface SuccessResponse {
  success: true;
  message?: string;
}

/**
 * Standard error response.
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

// ============================================
// Bills Calendar
// ============================================

/**
 * Bill item for calendar view.
 */
export interface BillItem {
  id: string;
  name: string;
  value: number;
  dueDate: string;
  type: "recurring" | "invoice";
  status: "pending" | "paid" | "overdue";
  category?: string;
  cardName?: string;
}

/**
 * Bills calendar response.
 */
export interface BillsCalendarResponse {
  bills: BillItem[];
  summary: {
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    upcomingTotal: number;
  };
}
