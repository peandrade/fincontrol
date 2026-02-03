"use client";

import { useState, useCallback, useMemo } from "react";

// ============================================
// Types
// ============================================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationControls {
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Reset to first page */
  reset: () => void;
  /** Set total items count */
  setTotal: (total: number) => void;
}

export interface PaginationInfo {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total items count */
  total: number;
  /** Total pages count */
  totalPages: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPrevPage: boolean;
  /** Index of first item on current page (0-indexed) */
  startIndex: number;
  /** Index of last item on current page (0-indexed) */
  endIndex: number;
  /** Number of items on current page */
  itemsOnPage: number;
}

export interface UsePaginationOptions {
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Initial page size (default: 20) */
  initialPageSize?: number;
  /** Initial total items (default: 0) */
  initialTotal?: number;
  /** Callback when page changes */
  onPageChange?: (page: number, pageSize: number) => void;
}

export interface UsePaginationReturn extends PaginationInfo, PaginationControls {
  /** Current pagination state for API requests */
  paginationParams: { page: number; pageSize: number };
}

// ============================================
// Hook
// ============================================

/**
 * Hook for managing pagination state and controls.
 *
 * @example
 * ```tsx
 * function MyList() {
 *   const {
 *     page,
 *     pageSize,
 *     totalPages,
 *     hasNextPage,
 *     hasPrevPage,
 *     nextPage,
 *     prevPage,
 *     goToPage,
 *     setTotal,
 *     paginationParams,
 *   } = usePagination({
 *     initialPageSize: 10,
 *     onPageChange: (page, pageSize) => {
 *       fetchData({ page, pageSize });
 *     },
 *   });
 *
 *   // Use paginationParams for API requests
 *   const { data } = useSWR(`/api/items?page=${page}&pageSize=${pageSize}`);
 *
 *   // Update total when data arrives
 *   useEffect(() => {
 *     if (data?.total) setTotal(data.total);
 *   }, [data?.total, setTotal]);
 *
 *   return (
 *     <div>
 *       {data?.items.map(item => <Item key={item.id} {...item} />)}
 *
 *       <Pagination
 *         page={page}
 *         totalPages={totalPages}
 *         onPrev={hasPrevPage ? prevPage : undefined}
 *         onNext={hasNextPage ? nextPage : undefined}
 *         onPageSelect={goToPage}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 20,
    initialTotal = 0,
    onPageChange,
  } = options;

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    pageSize: initialPageSize,
    total: initialTotal,
  });

  // Computed values
  const info = useMemo((): PaginationInfo => {
    const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
    const hasNextPage = state.page < totalPages;
    const hasPrevPage = state.page > 1;
    const startIndex = (state.page - 1) * state.pageSize;
    const endIndex = Math.min(startIndex + state.pageSize - 1, state.total - 1);
    const itemsOnPage = Math.max(0, endIndex - startIndex + 1);

    return {
      page: state.page,
      pageSize: state.pageSize,
      total: state.total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      startIndex,
      endIndex,
      itemsOnPage,
    };
  }, [state]);

  // Controls
  const nextPage = useCallback(() => {
    if (!info.hasNextPage) return;
    const newPage = state.page + 1;
    setState((prev) => ({ ...prev, page: newPage }));
    onPageChange?.(newPage, state.pageSize);
  }, [info.hasNextPage, state.page, state.pageSize, onPageChange]);

  const prevPage = useCallback(() => {
    if (!info.hasPrevPage) return;
    const newPage = state.page - 1;
    setState((prev) => ({ ...prev, page: newPage }));
    onPageChange?.(newPage, state.pageSize);
  }, [info.hasPrevPage, state.page, state.pageSize, onPageChange]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, info.totalPages));
      if (validPage === state.page) return;
      setState((prev) => ({ ...prev, page: validPage }));
      onPageChange?.(validPage, state.pageSize);
    },
    [info.totalPages, state.page, state.pageSize, onPageChange]
  );

  const setPageSize = useCallback(
    (size: number) => {
      if (size < 1) return;
      // Reset to page 1 when changing page size
      setState((prev) => ({ ...prev, pageSize: size, page: 1 }));
      onPageChange?.(1, size);
    },
    [onPageChange]
  );

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, page: 1 }));
    onPageChange?.(1, state.pageSize);
  }, [state.pageSize, onPageChange]);

  const setTotal = useCallback((total: number) => {
    setState((prev) => {
      // If current page is beyond new total pages, reset to last valid page
      const newTotalPages = Math.max(1, Math.ceil(total / prev.pageSize));
      const newPage = prev.page > newTotalPages ? newTotalPages : prev.page;
      return { ...prev, total, page: newPage };
    });
  }, []);

  const paginationParams = useMemo(
    () => ({ page: state.page, pageSize: state.pageSize }),
    [state.page, state.pageSize]
  );

  return {
    ...info,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    reset,
    setTotal,
    paginationParams,
  };
}

// ============================================
// Utilities
// ============================================

/**
 * Generate array of page numbers for pagination UI.
 * Shows first, last, current, and nearby pages with ellipsis.
 *
 * @example
 * getPageNumbers(5, 10) // [1, '...', 4, 5, 6, '...', 10]
 * getPageNumbers(1, 5)  // [1, 2, 3, 4, 5]
 * getPageNumbers(3, 5)  // [1, 2, 3, 4, 5]
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const halfVisible = Math.floor((maxVisible - 3) / 2); // -3 for first, last, and current

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if at the edges
  if (currentPage <= halfVisible + 2) {
    end = maxVisible - 2;
  } else if (currentPage >= totalPages - halfVisible - 1) {
    start = totalPages - maxVisible + 3;
  }

  // Add ellipsis before if needed
  if (start > 2) {
    pages.push("...");
  }

  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis after if needed
  if (end < totalPages - 1) {
    pages.push("...");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}
