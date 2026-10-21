import { and, eq, gte, inArray, lte, type SQL } from "drizzle-orm";

import type { FilterValue, TableColumns } from "./types";
import { getColumn, isDateRangeFilter } from "./utils";

/**
 * Build a `where` condition from a filter object.
 * Supports:
 * - Primitive values: eq(column, value)
 * - Arrays: inArray(column, values)
 * - Date ranges: { from, to } → gte/lte conditions
 */
export function buildFilterWhere(
  filter: Record<string, FilterValue | null | undefined> | null | undefined,
  tableColumns: TableColumns
): SQL | undefined {
  if (!filter || !Object.keys(filter).length) return undefined;

  const conditions = Object.entries(filter).flatMap(([key, value]) => {
    if (!value) {
      return [];
    }

    const col = getColumn(tableColumns, key);
    if (!col) return [];

    // Handle empty arrays → no results (or skip, based on preference)
    if (Array.isArray(value)) {
      if (value.length === 0) return []; // or: return [sql`1=0`] to force no results
      return [inArray(col, value)];
    }

    // Handle date range filter
    if (isDateRangeFilter(value)) {
      const rangeConditions: SQL[] = [];

      if (value.from) {
        rangeConditions.push(gte(col, value.from));
      }
      if (value.to) {
        rangeConditions.push(lte(col, value.to));
      }

      return [and(...rangeConditions)];
    }

    // Handle primitive value (including null/undefined)
    return [eq(col, value)];
  });

  if (!conditions.length) return undefined;

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}
