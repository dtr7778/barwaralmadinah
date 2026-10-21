import type { SQL } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

/** Any Drizzle table or plain column map can be used as a column source */
export type TableColumns = Record<string, SQLiteColumn>;

/** Date range filter for temporal columns */
export interface DateRangeFilter {
  from?: Date | null;
  to?: Date | null;
}

/** Union type for filter values: primitive values, arrays or date ranges */
export type FilterValue = unknown | unknown[] | DateRangeFilter;

export interface PaginateQueryOptions {
  /** Pagination page number (1-based) */
  page?: number | null | undefined;

  /** Number of items per page */
  limit?: number | null | undefined;

  /** Sorting direction */
  order?: "asc" | "desc" | null | undefined;

  /** Field name to order by — resolved via tableColumns */
  orderField?: string | null | undefined;

  /** Free-text search keyword */
  search?: string | null | undefined;

  /** Field names to search in — resolved via tableColumns */
  searchFields?: string[] | null | undefined;

  /**
   * Additional filter object — supports:
   * - Primitive: { status: "active" } → eq
   * - Array: { status: ["active", "pending"] } → inArray
   * - Date range: { createdAt: { from, to } } → gte/lte
   */
  filter?: Record<string, FilterValue> | null | undefined;
}

export interface PaginationMeta {
  /**
   * Indicates whether the current page is the first page.
   * True when `currentPage` equals 1.
   */
  isFirstPage: boolean;

  /**
   * Indicates whether the current page is the last available page.
   * True when `currentPage` is equal to `pageCount`.
   */
  isLastPage: boolean;

  /**
   * The current page number being returned.
   */
  currentPage: number;

  /**
   * The previous page number if it exists.
   * Returns `null` when the current page is the first page.
   */
  previousPage: number | null;

  /**
   * The next page number if it exists.
   * Returns `null` when the current page is the last page.
   */
  nextPage: number | null;

  /**
   * Total number of pages available based on the total item count
   * and the number of items per page.
   */
  pageCount: number;

  /**
   * Total query count
   */
  queryCount: number;

  /**
   * Total number of items that match the query in the database,
   * regardless of pagination limits.
   */
  totalCount: number;
}

export interface PaginateResult {
  where: SQL | undefined;
  orderBy: SQL;
  limit: number;
  offset: number;
  page: number;
}
