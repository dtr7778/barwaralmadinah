import { asc, desc, sql, type SQL } from "drizzle-orm";

import type { TableColumns } from "./types";
import { getColumn } from "./utils";

/**
 * Build an `orderBy` SQL expression from a field name and direction.
 */
export function buildOrderBy(
  orderField: string | null | undefined,
  order: "asc" | "desc" | null | undefined,
  tableColumns: TableColumns
): SQL {
  if (!orderField || !order) return sql`1`;

  const col = getColumn(tableColumns, orderField);

  if (!col) return sql`1`;

  return order === "asc" ? asc(col) : desc(col);
}
