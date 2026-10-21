import type { AnyColumn, InferColumnsDataTypes, SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";

function joinSql(values: (SQL | AnyColumn)[], separator: SQL): SQL {
  return sql.join(values, separator);
}

export function coalesce<T>(values: (SQL | AnyColumn)[]): SQL<T> {
  return sql<T>`COALESCE(${joinSql(values, sql`, `)})`;
}

export function jsonObject<TColumns extends Record<string, AnyColumn>>(
  columns: TColumns
): SQL<InferColumnsDataTypes<TColumns>> {
  const parts = Object.entries(columns).flatMap(([key, col]) => [
    sql`${key}`, // bound parameter, no manual quoting
    col,
  ]);

  return sql<InferColumnsDataTypes<TColumns>>`json_object(${sql.join(
    parts,
    sql`, `
  )})`;
}

function buildJsonGroupArray<TColumns extends Record<string, AnyColumn>>(
  columns: TColumns,
  filterColumn: AnyColumn | undefined,
  distinct: boolean
): SQL<InferColumnsDataTypes<TColumns>[]> {
  const filterCol = filterColumn ?? Object.values(columns)[0];
  const aggregate = distinct
    ? sql`json_group_array(DISTINCT ${jsonObject(columns)})`
    : sql`json_group_array(${jsonObject(columns)})`;

  // json_group_array returns '[]' when the FILTER excludes every row,
  // so no COALESCE is needed. SQLite returns TEXT, so parse it.
  return sql<
    InferColumnsDataTypes<TColumns>[]
  >`${aggregate} FILTER (WHERE ${filterCol} IS NOT NULL)`.mapWith((value) =>
    typeof value === "string" ? JSON.parse(value) : (value ?? [])
  );
}

export function jsonGroupArray<TColumns extends Record<string, AnyColumn>>(
  columns: TColumns,
  filterColumn?: AnyColumn
): SQL<InferColumnsDataTypes<TColumns>[]> {
  return buildJsonGroupArray(columns, filterColumn, false);
}
