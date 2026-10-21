import { buildFilterWhere } from "./buildFilterWhere";
import { buildOrderBy } from "./buildOrderBy";
import { buildSearchWhere } from "./buildSearchWhere";
import { buildWhere } from "./buildWhere";
import type {
  PaginateQueryOptions,
  PaginateResult,
  TableColumns,
} from "./types";
import { resolveColumns } from "./utils";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Build Drizzle-compatible pagination and query options from a plain options object.
 * Includes metadata when totalCount is provided.
 *
 * @example
 * const { where, orderBy, limit, offset, meta } = buildPaginateOptions(UserTable, input, totalCount);
 *
 * const rows = await db
 *   .select()
 *   .from(UserTable)
 *   .where(where)
 *   .orderBy(orderBy ?? sql`1`)
 *   .limit(limit)
 *   .offset(offset)
 */
export function buildPaginateOptions(
  /**
   * Drizzle table object or a plain `{ fieldName: column }` map.
   * Used to resolve all string-based fields (filter, orderField, searchFields, select).
   *
   * @example
   * tableColumns: UserTable
   * // or
   * tableColumns: { id: UserTable.id, name: UserTable.name }
   */
  tableColumns: TableColumns,
  options: PaginateQueryOptions
): PaginateResult {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    orderField,
    order,
    search,
    searchFields,
    filter,
  } = options;

  const pageValue = Math.max(1, Number(page));
  const limitValue = Math.max(1, Number(limit));
  const offset = (pageValue - 1) * limitValue;

  const searchColumns = resolveColumns(searchFields, tableColumns);
  const searchWhere = buildSearchWhere(search, searchColumns);
  const filterWhere = buildFilterWhere(filter, tableColumns);

  const where = buildWhere(filterWhere, searchWhere);

  const orderBy = buildOrderBy(orderField, order, tableColumns);

  return {
    where,
    orderBy,
    limit: limitValue,
    offset,
    page: pageValue,
  };
}
