import type { SQLiteColumn } from "drizzle-orm/sqlite-core";

import type { DateRangeFilter, TableColumns } from "./types";

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDateRangeFilter(value: unknown): value is DateRangeFilter {
  return (
    isObject(value) &&
    "from" in value &&
    "to" in value &&
    (value.from instanceof Date ||
      value.from === null ||
      value.from === undefined) &&
    (value.to instanceof Date || value.to === null || value.to === undefined)
  );
}

/**
 * Extract a column by field name from either a table object or a plain column map.
 */
export function getColumn(
  tableColumns: TableColumns,
  field: string
): SQLiteColumn | undefined {
  // The index signature hides that a field may be absent at runtime.
  const col = tableColumns[field] as SQLiteColumn | undefined;
  return col && "columnType" in col ? col : undefined;
}

/**
 * Resolve field name strings to Drizzle column references.
 */
export function resolveColumns(
  fields: string[] | null | undefined,
  tableColumns: TableColumns
): SQLiteColumn[] {
  if (!fields || fields.length === 0) return [];

  return fields.flatMap((f) => {
    const col = getColumn(tableColumns, f);
    return col ? [col] : [];
  });
}
