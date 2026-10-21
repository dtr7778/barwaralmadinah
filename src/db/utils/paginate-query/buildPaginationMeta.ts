import type { PaginationMeta } from "./types";

/**
 * Calculate pagination metadata based on total count
 */
export function buildPaginationMeta(
  totalCount: number,
  queryCount: number,
  page: number,
  perPage: number
): PaginationMeta {
  const pageCount = Math.ceil(
    (queryCount === perPage ? totalCount : queryCount) / perPage
  );

  return {
    currentPage: page,
    isFirstPage: page === 1,
    isLastPage: page >= pageCount,
    previousPage: page > 1 ? page - 1 : null,
    nextPage: page < pageCount ? page + 1 : null,
    pageCount,
    queryCount,
    totalCount,
  };
}
