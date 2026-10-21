import { and, type SQL } from "drizzle-orm";

/**
 * Combine filter and search `where` conditions using `and` logic.
 * If both exist, combines them with `and`. Otherwise, returns whichever exists.
 */
export function buildWhere(
  filterWhere: SQL | undefined,
  searchWhere: SQL | undefined
): SQL | undefined {
  if (!filterWhere || !searchWhere) return filterWhere ?? searchWhere;

  return and(filterWhere, searchWhere);
}
