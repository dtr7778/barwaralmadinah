# Database Query Utilities — Test Implementation

Scope: `src/db/utils/**`, `src/db/sql-helpers.ts` — D1-safe batched inserts,
pagination option building, filter/search/order SQL construction, reusable column
builders, and SQLite JSON aggregation helpers. These utilities are the only path
between feature code and D1 in this repository; an off-by-one in a bound-parameter
chunk or a dropped filter silently corrupts list results. Money stored through
these builders is a SQLite `REAL`, so float behavior is a P0 concern (DBU-060).

## Source map

| File                                                  | Responsibility                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/db/utils/chunk-by-params.ts`                     | Bound-parameter budgeting, recursive insert splitting, result collection         |
| `src/db/utils/paginate-query/buildPaginateOptions.ts` | Assembles where/orderBy/limit/offset/page from a plain options object            |
| `src/db/utils/paginate-query/buildPaginationMeta.ts`  | Derives page flags and counts from totals                                        |
| `src/db/utils/paginate-query/buildFilterWhere.ts`     | Equality, `IN`, and date-range filter conditions                                 |
| `src/db/utils/paginate-query/buildSearchWhere.ts`     | `LIKE` search across resolved columns                                            |
| `src/db/utils/paginate-query/buildOrderBy.ts`         | Allow-listed sort column and direction                                           |
| `src/db/utils/paginate-query/buildWhere.ts`           | Combines filter and search conditions with `AND`                                 |
| `src/db/utils/paginate-query/utils.ts`                | Object/date-range guards and column resolution                                   |
| `src/db/utils/paginate-query/types.ts`                | Public option and result contracts                                               |
| `src/db/utils/paginate-query/index.ts`                | Barrel export for the pagination API                                             |
| `src/db/utils/db-utils.ts`                            | Reusable Drizzle column builders (ids, timestamps, booleans, money, soft delete) |
| `src/db/utils/index.ts`                               | Barrel export for database utilities                                             |
| `src/db/sql-helpers.ts`                               | `COALESCE` and SQLite JSON object/array aggregation expressions                  |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 10     |
| Partial     | 1      |
| Missing     | 54     |
| **Total**   | **65** |

Existing test files:

- `src/db/utils/chunk-by-params.test.ts` — `chunkByParams` empty/fit/split/minimum
  cases and `insertChunked`/`insertChunkedReturning` no-op, no-split, recursive
  split, result flattening, and oversized-single-row behavior. Covers DBU-001..004,
  DBU-008..011, and DBU-015.
- `src/db/utils/paginate-query/buildPaginateOptions.test.ts` — builds options for
  page 1, limit 10, a search term, and a sort, then asserts only `limit`, `offset`,
  and `page` via a subset matcher. Covers DBU-018 partially; it does not assert
  `where`, `orderBy`, defaults, or clamping.
- `src/db/utils/paginate-query/buildPaginationMeta.test.ts` — first-page metadata
  for `totalCount=100`, `queryCount=50`, `page=1`, `limit=10`, exact object.
  Covers DBU-030.

`pnpm test` was run on 2026-10-21: 4 files, 12 tests, all passing.

## Test environment

- **Unit:** all builders are pure and return Drizzle SQL objects. Assert behavior
  through the compiled statement (`.toSQL()` text and bound params) or by
  executing the built fragment in an in-memory SQLite-compatible client. The
  repository already depends on `@libsql/client` for tooling; a libsql in-memory
  database is the preferred way to prove filter/order semantics, with
  `.toSQL()` assertions reserved for structure that execution cannot show.
- **D1 specifics:** D1's 100-bound-parameter limit is the reason for the chunking
  helpers. Tests must not require a real Cloudflare binding; the existing suite
  uses a lazy fake insert query whose compiled parameter count is derived from the
  row count. Reuse that pattern for new chunking cases.
- **Column fixtures:** define local `sqliteTable` fixtures inside the test (as
  `buildPaginateOptions.test.ts` does) or use the real tables read-only. Never
  create or migrate a database from a unit test.
- **Integration:** DB defaults (`unixepoch() * 1000`, `$onUpdate`) and boolean
  round-trips require a real SQLite engine. Use a temporary in-memory database and
  the matching Drizzle driver; do not mock the database to prove database
  behavior.
- **Auth/permissions:** not applicable; these are data-layer utilities.
- **Determinism:** freeze `Date.now` for `$onUpdate`, stub `crypto.randomUUID` for
  id assertions (DBU-055), and never rely on insertion order without an explicit
  `orderBy`. Faker is not used here.
- **Money:** `db_money` is `REAL`. Every monetary assertion must use a tolerance.
  Prefer integer minor units in feature code; see DBU-060.

## Batched inserts and bound-parameter limits

### DBU-001 · Empty input produces no chunks

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** an empty row array
- **When** `chunkByParams` is called with any positive `paramsPerRow`
- **Then** the result is an empty array, not an array containing an empty chunk
- **Notes:** implemented in `chunk-by-params.test.ts`.

### DBU-002 · Rows that fit stay in a single ordered chunk

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** ten rows and a `paramsPerRow` that keeps the batch under 100
- **When** chunks are built
- **Then** exactly one chunk is returned containing every row in the original
  order
- **Notes:** implemented in `chunk-by-params.test.ts`.

### DBU-003 · Rows are split at the parameter budget without loss or reordering

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** `D1_MAX_BOUND_PARAMS + 5` rows and `paramsPerRow = 2`
- **When** chunks are built
- **Then** there are three chunks of 50, 50, and 5 rows; flattening them reproduces
  the input exactly
- **Notes:** implemented in `chunk-by-params.test.ts`. The unchunked batch would
  exceed D1's limit and fail the insert.

### DBU-004 · A single row is the minimum chunk size

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** three rows and `paramsPerRow` greater than the parameter limit
- **When** chunks are built
- **Then** each chunk contains exactly one row, in order
- **Notes:** implemented in `chunk-by-params.test.ts`. The alternative — an empty
  or zero-sized chunk — would loop forever.

### DBU-005 · Chunking does not mutate the input array

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** an array of objects and its original length and order recorded
- **When** chunks are built
- **Then** the input array is unchanged and chunks contain the same object
  references (slices, not clones)
- **Notes:** callers may reuse the row array after a failed insert attempt. This
  is a cheap regression guard.

### DBU-006 · A zero or negative parameter count is rejected or normalized

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `paramsPerRow` of `0`, `-1`, and `NaN`
- **When** chunks are built for a non-empty row array
- **Then** the behavior is explicit: zero and `NaN` should be rejected or treated
  as invalid rather than silently producing one unbounded chunk; a negative value
  currently behaves like one row per chunk
- **Notes:** ambiguity to resolve with the owner. `0` divides to infinity, which
  yields a single chunk and defeats the safety guarantee. Record the chosen
  contract before implementing.

### DBU-007 · Fractional parameter counts round down

- **Covers:** `chunkByParams` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `paramsPerRow = 3.5` and an oversized row set
- **When** chunks are built
- **Then** the chunk size is the floor of the quotient (28 rows for the 100-param
  budget), never the rounded-up value that could exceed the limit
- **Notes:** real callers should pass integers; this locks the safe direction if
  they do not.

### DBU-008 · An empty insert batch executes nothing

- **Covers:** `insertChunked` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** no rows and a query builder that records execution
- **When** `insertChunked` runs
- **Then** the builder is never executed and the promise resolves
- **Notes:** implemented in `chunk-by-params.test.ts`. A stray empty `.values([])`
  is a SQL error in D1.

### DBU-009 · A batch within the limit is inserted in one statement

- **Covers:** `insertChunked` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** twenty rows whose compiled statement has fewer than 100 parameters
- **When** `insertChunked` runs
- **Then** exactly one statement is executed with all twenty rows
- **Notes:** implemented in `chunk-by-params.test.ts`. Splitting here would be
  slower but not incorrect; the point is that the fast path is taken.

### DBU-010 · Oversized batches are halved until each statement fits

- **Covers:** `insertChunked` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** sixty rows at four parameters per row (240 params)
- **When** `insertChunked` runs
- **Then** four statements of fifteen rows each execute, in original order, every
  row exactly once
- **Notes:** implemented in `chunk-by-params.test.ts`. Proves the recursive split
  is based on compiled parameters, not an estimate.

### DBU-011 · A single oversized row is still sent

- **Covers:** `insertChunkedReturning` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** one row whose compiled parameters exceed the limit
- **When** the insert runs
- **Then** the row is executed as-is rather than dropped or split infinitely
- **Notes:** implemented in `chunk-by-params.test.ts`. The database will reject
  it; the helper must not hang.

### DBU-012 · The void insert discards returned values

- **Covers:** `insertChunked` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a builder that resolves to row objects
- **When** `insertChunked` runs
- **Then** the function resolves to `undefined` and the caller receives no rows
- **Notes:** distinguishes it from `insertChunkedReturning`; a feature that needs
  ids must use the returning variant.

### DBU-013 · A failed chunk rejects and stops later chunks

- **Covers:** `insertChunked`, `insertChunkedReturning` —
  `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** three chunks where the second execution rejects with a database error
- **When** the insert runs
- **Then** the promise rejects with that error, the third chunk is never executed,
  and no partial result is returned
- **Notes:** partial writes are possible because there is no transaction wrapper.
  The test must document that existing behavior; whether the helper should
  transact is an open question for feature owners.

### DBU-014 · The returning insert resolves to an empty array for no rows

- **Covers:** `insertChunkedReturning` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** no rows
- **When** `insertChunkedReturning` runs
- **Then** it resolves to an empty array and never executes the builder
- **Notes:** callers spread the result; `undefined` would crash them.

### DBU-015 · Returned rows from all chunks are flattened in execution order

- **Covers:** `insertChunkedReturning` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Implemented
- **Given** sixty rows split into four chunks, each returning its chunk
- **When** `insertChunkedReturning` runs
- **Then** the result contains all sixty rows in the original order
- **Notes:** implemented in `chunk-by-params.test.ts`. Order matters for seed code
  that immediately maps the returned ids back to roles.

### DBU-016 · The D1 bound-parameter budget is exactly one hundred

- **Covers:** `D1_MAX_BOUND_PARAMS` — `src/db/utils/chunk-by-params.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the exported constant
- **When** it is read
- **Then** it equals `100`, matching Cloudflare D1's documented per-statement
  limit
- **Notes:** the existing tests use the constant, so they would still pass if it
  changed; this case pins the platform contract. Verify the limit against
  Cloudflare documentation when D1 changes.

## Pagination option building

### DBU-017 · Pagination defaults are page one and twenty rows

- **Covers:** `buildPaginateOptions` — `src/db/utils/paginate-query/buildPaginateOptions.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an options object with no `page` and no `limit`
- **When** pagination is built
- **Then** the result reports page `1`, limit `20`, and offset `0`
- **Notes:** null is not the same as omitted here; see DBU-019.

### DBU-018 · Supplied page and limit produce the offset and result shape

- **Covers:** `buildPaginateOptions` — `src/db/utils/paginate-query/buildPaginateOptions.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Partial
- **Given** page `1`, limit `10`, a search term, a sort field, and an empty filter
- **When** pagination is built
- **Then** the result exposes `page: 1`, `limit: 10`, `offset: 0`, plus `where`
  and `orderBy` entries
- **Notes:** the existing test asserts only `limit`, `offset`, and `page`. It does
  not verify the offset for pages beyond one, nor the `where`/`orderBy` values.
  Keep this case `Partial`; DBU-022..029 cover the missing assertions.

### DBU-019 · Page and limit below one are clamped, while null is not defaulted

- **Covers:** `buildPaginateOptions` — `src/db/utils/paginate-query/buildPaginateOptions.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** page `0` and `-3`, then limit `0` and `-5`, then page and limit `null`
- **When** pagination is built
- **Then** zero and negative values clamp to `1`; explicit `null` also yields page
  `1` but limit `1` (not the default `20`), because defaults apply only to
  `undefined`
- **Notes:** the null-limit behavior is surprising and currently unasserted. If it
  is unintended, fix the implementation and update this case; do not encode an
  accident as a requirement without asking.

### DBU-020 · Numeric strings are coerced to numbers

- **Covers:** `buildPaginateOptions` — `src/db/utils/paginate-query/buildPaginateOptions.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** page `"2"` and limit `"10"` supplied from a query-string parser that
  did not coerce them
- **When** pagination is built
- **Then** page is `2`, limit is `10`, and offset is `10`
- **Notes:** the implementation applies `Number`; this case documents tolerance of
  string input. `""` coerces to `0` and then clamps to `1`.

### DBU-021 · Non-finite page or limit values are rejected or normalized

- **Covers:** `buildPaginateOptions` — `src/db/utils/paginate-query/buildPaginateOptions.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** page `NaN` or limit `Infinity`
- **When** pagination is built
- **Then** the result must not contain `NaN`/`Infinity` in `limit` or `offset`
- **Notes:** current code clamps with `Math.max`, which propagates `NaN`. This is
  an open defect candidate; write the case as Missing and settle the expected
  behavior (throw vs. fall back to defaults) before implementing.

### DBU-022 · Search matches any resolved column

- **Covers:** `buildPaginateOptions`, `buildSearchWhere` —
  `src/db/utils/paginate-query/buildPaginateOptions.ts`,
  `src/db/utils/paginate-query/buildSearchWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a `search` value and `searchFields` naming two columns
- **When** pagination options are built
- **Then** the compiled condition contains one `LIKE` per field with the term
  wrapped in `%...%`, joined with `OR`
- **Notes:** SQLite `LIKE` is ASCII case-insensitive by default; do not add
  `ILIKE`, which D1 does not support.

### DBU-023 · Unknown search fields are ignored

- **Covers:** `buildPaginateOptions`, `resolveColumns` —
  `src/db/utils/paginate-query/buildPaginateOptions.ts`,
  `src/db/utils/paginate-query/utils.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `searchFields` containing one valid column and one name that does not
  exist on the table
- **When** pagination is built
- **Then** only the valid column contributes a `LIKE` condition, and no error is
  thrown
- **Notes:** search fields come from callers, not user input, but a renamed column
  must degrade rather than crash.

### DBU-024 · Blank or whitespace-only search adds no condition

- **Covers:** `buildSearchWhere` — `src/db/utils/paginate-query/buildSearchWhere.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `search` of `undefined`, `""`, and `"   "`
- **When** the search condition is built
- **Then** the first two produce no condition; whitespace currently produces a
  `LIKE '%   %'` condition and is an ambiguity to resolve
- **Notes:** most UIs trim before calling. Decide whether the builder should trim;
  record the decision here and adjust the case with the implementation.

### DBU-025 · Filter values map to equality, `IN`, and date ranges

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a filter with a primitive value, an array of values, and a
  `{ from, to }` date range on three different columns
- **When** the filter condition is built
- **Then** the result uses `= ?`, `IN (?, ?)`, and `>= ? AND <= ?` respectively,
  combined with `AND`
- **Notes:** execution against in-memory SQLite is the clearest proof; `.toSQL()`
  inspection is acceptable for the operator structure.

### DBU-026 · Filter and search conditions are combined with `AND`

- **Covers:** `buildPaginateOptions`, `buildWhere` —
  `src/db/utils/paginate-query/buildPaginateOptions.ts`,
  `src/db/utils/paginate-query/buildWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a search term and a filter that both match different rows
- **When** options are built and executed
- **Then** only rows satisfying both the filter and the search are returned
- **Notes:** an `OR` here would leak rows across tenants/filters. Execute with a
  small fixture set rather than only inspecting SQL.

### DBU-027 · Unknown sort fields fall back to a neutral order

- **Covers:** `buildOrderBy` — `src/db/utils/paginate-query/buildOrderBy.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `orderField: "notAColumn"` with `order: "asc"`
- **When** the order expression is built
- **Then** the expression is the neutral constant (`1`), not an error and not an
  arbitrary column sort
- **Notes:** this is the allow-list mechanism: only names present in the table
  map can be sorted. The neutral order means database-defined row order.

### DBU-028 · A sort needs both field and direction

- **Covers:** `buildOrderBy` — `src/db/utils/paginate-query/buildOrderBy.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a valid field with no direction, and a direction with no field
- **When** the order expression is built
- **Then** both cases produce the neutral constant (`1`) and no partial sort
- **Notes:** prevents accidental ordering by an arbitrary column when a UI sends
  only half of the sort state.

### DBU-029 · Ascending and descending orders use the requested direction

- **Covers:** `buildOrderBy` — `src/db/utils/paginate-query/buildOrderBy.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a valid column and `asc`, then `desc`
- **When** each order expression is built
- **Then** the compiled SQL ends with the column followed by `asc` or `desc`
  respectively
- **Notes:** assert compiled SQL or execute against rows with distinct values.

## Pagination metadata

### DBU-030 · First-page metadata reports the next page and total pages

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Implemented
- **Given** `totalCount=100`, `queryCount=50`, `page=1`, `perPage=10`
- **When** metadata is built
- **Then** the result is exactly `{ isFirstPage: true, isLastPage: false,
currentPage: 1, previousPage: null, nextPage: 2, pageCount: 5, queryCount: 50,
totalCount: 100 }`
- **Notes:** implemented in `buildPaginationMeta.test.ts`.

### DBU-031 · Last-page metadata has no next page

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a page equal to the computed page count
- **When** metadata is built
- **Then** `isLastPage` is `true`, `nextPage` is `null`, and `previousPage` is
  `page - 1`
- **Notes:** prevents pagination from offering an empty next page.

### DBU-032 · A middle page has both neighbours

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** page `2` of `5`
- **When** metadata is built
- **Then** `isFirstPage` and `isLastPage` are both `false`, `previousPage` is `1`,
  and `nextPage` is `3`
- **Notes:** complements DBU-030 and DBU-031.

### DBU-033 · A full query page uses the total count for page count

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `queryCount === perPage` and `totalCount` larger than `queryCount`
- **When** metadata is built
- **Then** `pageCount` is computed from `totalCount` (for example 100/10 = 10),
  not from the current page's row count
- **Notes:** this is the branch that makes "is there a next page?" correct when
  the current page happens to be full.

### DBU-034 · A partial last page rounds the page count up

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a filtered result of 21 rows at 10 per page
- **When** metadata is built
- **Then** `pageCount` is `3` and page 3 reports `isLastPage: true`
- **Notes:** `Math.ceil` is required; flooring would hide the last row.

### DBU-035 · An empty result set has coherent page flags

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `totalCount=0`, `queryCount=0`, `page=1`
- **When** metadata is built
- **Then** the result is internally consistent: page count `0`, no previous or
  next page, and both `isFirstPage` and `isLastPage` are `true`
- **Notes:** `1 >= 0` currently makes the first page "last". Decide whether an
  empty result should report `currentPage: 0`; record the answer before changing
  the contract.

### DBU-036 · A zero page size cannot produce a valid page count

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `perPage=0`
- **When** metadata is built
- **Then** the function must fail explicitly or return a documented sentinel; it
  must not return `Infinity` or `NaN` to callers
- **Notes:** `buildPaginateOptions` clamps limit to at least one, but this
  function is public and can be called directly. Choose reject-or-clamp and
  record it.

### DBU-037 · A page beyond the last page is reported as last

- **Covers:** `buildPaginationMeta` —
  `src/db/utils/paginate-query/buildPaginationMeta.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** page `99` when `pageCount` is `5`
- **When** metadata is built
- **Then** `isLastPage` is `true`, `nextPage` is `null`, and `previousPage` is
  `98`
- **Notes:** the function does not clamp the current page; callers that deep-link
  must handle an empty result themselves. Assert the documented behavior.

## Filter, search, and where builders

### DBU-038 · A missing or empty filter produces no condition

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `null`, `undefined`, and `{}`
- **When** the filter condition is built
- **Then** each returns `undefined` so the final query is unfiltered
- **Notes:** returning a truthy empty expression would silently change result
  sets.

### DBU-039 · Primitive filter values become equality conditions

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a filter of `{ status: "active" }`
- **When** the condition is built
- **Then** the compiled SQL is `column = ?` with `active` bound, and only matching
  rows are returned when executed
- **Notes:** include a column that stores an enum-like string.

### DBU-040 · Array filter values become `IN` conditions

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a filter of `{ status: ["active", "pending"] }`
- **When** the condition is built and executed
- **Then** rows with either value are returned and all other statuses are excluded
- **Notes:** order of bound values follows the input array; do not assert the
  `IN` list order unless the implementation guarantees it.

### DBU-041 · An empty array filter is skipped

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `{ status: [] }`
- **When** the condition is built
- **Then** no condition is added and the query stays unfiltered
- **Notes:** the code documents this as a choice; the alternative is a `1 = 0`
  condition that returns no rows. A UI that sends an empty selection expects "no
  filter", so preserve this behavior deliberately.

### DBU-042 · Date ranges become inclusive bounds

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ createdAt: { from: A, to: B } }`, then `{ from: A }` with `to: null`,
  then `{ from: null, to: B }`
- **When** conditions are built
- **Then** both bounds produce `>= A AND <= B`, and one-sided ranges produce only
  the bound that is present
- **Notes:** bounds are inclusive on both ends. When both are null the result is
  no condition; assert that explicitly in DBU-045.

### DBU-043 · Falsy primitive filter values are not silently dropped

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** filters of `{ banned: false }`, `{ balance: 0 }`, and `{ note: "" }`
- **When** the condition is built
- **Then** each must either filter by that exact value or reject the filter
  explicitly; they must not be skipped as if absent
- **Notes:** current code skips every falsy value, so `banned: false` (active
  users) returns all users. This is a correctness defect candidate. Write the
  case as Missing and ask whether SQL null semantics or the guard should change.

### DBU-044 · Unknown filter keys are ignored

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a filter containing a key that is not a column on the table
- **When** the condition is built
- **Then** that key contributes nothing, valid keys still apply, and no error is
  thrown
- **Notes:** keeps a stale client filter from breaking the page. Together with the
  order allow-list, this is the query-injection boundary.

### DBU-045 · Multiple filters combine with `AND`

- **Covers:** `buildFilterWhere` — `src/db/utils/paginate-query/buildFilterWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** two independently matching filters, and a date range whose bounds are
  both null
- **When** the condition is built and executed
- **Then** only rows matching both filters are returned, and the null-bounded
  range contributes no condition
- **Notes:** covers the empty date-range edge that DBU-042 leaves open.

### DBU-046 · A malformed date range is not treated as equality

- **Covers:** `buildFilterWhere`, `isDateRangeFilter` —
  `src/db/utils/paginate-query/buildFilterWhere.ts`,
  `src/db/utils/paginate-query/utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a filter value `{ from: "2026-01-01", to: "2026-02-01" }` with strings
  instead of dates, or `{ from: A }` without a `to` key
- **When** the condition is built
- **Then** the value either produces a validation error or a documented
  date-range interpretation; it must not bind a plain object as an equality value
- **Notes:** the guard requires both keys and real `Date` instances. A missing
  `to` key falls through to equality with an object, which Drizzle may reject at
  runtime. Decide the contract and test that decision.

### DBU-047 · Search on one field produces a single `LIKE`

- **Covers:** `buildSearchWhere` — `src/db/utils/paginate-query/buildSearchWhere.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a search term and one column
- **When** the condition is built
- **Then** it is that column's `LIKE '%term%'` condition, not an `OR` wrapper
- **Notes:** the single-condition fast path must not change matching behavior.

### DBU-048 · Search on several fields is an `OR`

- **Covers:** `buildSearchWhere` — `src/db/utils/paginate-query/buildSearchWhere.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a term and three columns
- **When** the condition is executed against rows matching only the third column
- **Then** the matching row is returned, proving `OR` rather than `AND`
- **Notes:** an `AND` would require the same term in every column and almost
  always return nothing.

### DBU-049 · Search wildcards are treated literally or escaped

- **Covers:** `buildSearchWhere` — `src/db/utils/paginate-query/buildSearchWhere.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a search term containing `%` or `_`, such as `50%`
- **When** the query executes
- **Then** the behavior is documented: either the characters match literally
  (escaped) or they act as wildcards (current behavior, returning broader results)
- **Notes:** current code interpolates them into `LIKE`, so `%` matches everything.
  Decide whether user search should escape wildcards. This is not SQL injection
  because the term is bound, but it changes result semantics.

### DBU-050 · Filter and search combine only when both exist

- **Covers:** `buildWhere` — `src/db/utils/paginate-query/buildWhere.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** filter-only, search-only, both, and neither
- **When** `buildWhere` is called
- **Then** it returns the filter, the search, an `AND` of both, and `undefined`
  respectively
- **Notes:** all four branches are cheap to cover in one table-driven test.

## Column resolution helpers

### DBU-051 · Object detection rejects arrays and null

- **Covers:** `isObject` — `src/db/utils/paginate-query/utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `null`, `undefined`, an array, a Date, and a plain object
- **When** `isObject` is called
- **Then** only the plain object returns `true`; arrays, null, and undefined return
  `false`; a Date returns `true` because it is an object
- **Notes:** the Date result matters because the date-range guard checks `from`/`to`
  afterwards.

### DBU-052 · A date range requires both keys, and both must be date-like

- **Covers:** `isDateRangeFilter` — `src/db/utils/paginate-query/utils.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `{ from: Date, to: Date }`, `{ from: Date }`, `{ from: null, to: null }`,
  `{ from: "x", to: "y" }`, and a plain object `{}`
- **When** the guard is called
- **Then** only the first and third forms are ranges (the third has both keys with
  null values); a missing key or string values are rejected
- **Notes:** the third form yields no bounds at the filter level (DBU-045). The
  missing-`to` behavior causes the fall-through described in DBU-046.

### DBU-053 · Column lookup rejects missing names and non-columns

- **Covers:** `getColumn` — `src/db/utils/paginate-query/utils.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a column map, a missing key, and a key whose value is a plain object
  without a `columnType`
- **When** `getColumn` is called
- **Then** the real column is returned, and the other two return `undefined`
- **Notes:** this is the allow-list check for filters, search, and sort. It must
  not be loosened to accept arbitrary keys.

### DBU-054 · Column name lists resolve to existing columns only

- **Covers:** `resolveColumns` — `src/db/utils/paginate-query/utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `null`, an empty list, and a list mixing valid and unknown names
- **When** columns are resolved
- **Then** the first two return `[]` and the third returns only the valid columns,
  preserving their input order
- **Notes:** used by search only at this commit, but the helper is public.

## Column builders

### DBU-055 · Ids are UUID primary keys generated when omitted

- **Covers:** `db_id` — `src/db/utils/db-utils.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** an insert that omits `id` and a stubbed `crypto.randomUUID` returning
  a fixed UUID
- **When** the row is inserted and read back
- **Then** the stored id equals the stub, is unique per row, and rejecting a
  duplicate id violates the primary key
- **Notes:** stub the UUID source so the test does not depend on randomness.
  Proving uniqueness requires a real in-memory database.

### DBU-056 · Created and updated timestamps are millisecond Unix times

- **Covers:** `db_created_at`, `db_updated_at`, `db_date` —
  `src/db/utils/db-utils.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a frozen clock and an inserted row without timestamps
- **When** the row is read back, then updated
- **Then** creation and update are `Date` instances with millisecond precision
  and the database default is `unixepoch() * 1000`; updating sets `updated_at` to
  the frozen now while `created_at` stays unchanged
- **Notes:** `$onUpdate` runs in the Drizzle client, not the database; freeze time
  so the assertion is stable. A seconds/milliseconds mix-up is a common D1 bug.

### DBU-057 · Boolean columns round-trip as booleans

- **Covers:** `db_bool` — `src/db/utils/db-utils.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** rows inserted with `true` and `false`
- **When** they are read back and filtered by boolean value
- **Then** the values are `true` and `false` in JavaScript and stored as `1` and
  `0` in SQLite
- **Notes:** pair with DBU-043: reading booleans is not the same as filtering by
  them, and the filter builder currently drops `false`.

### DBU-058 · Date columns store timestamps in millisecond mode

- **Covers:** `db_date` — `src/db/utils/db-utils.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a specific `Date`
- **When** it is stored and read with `db_date`
- **Then** the round-trip produces the same instant, and a null value stays null
- **Notes:** covers the nullable case used by ban and soft-delete timestamps.

### DBU-059 · Soft-delete columns are nullable and independent

- **Covers:** `db_soft_delete` — `src/db/utils/db-utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the shared soft-delete column set spread into a table
- **When** its column definitions are inspected
- **Then** `deletedAt` is a nullable timestamp and `deletedBy` is nullable text,
  with no default
- **Notes:** a default would mark every row deleted on insert. Do not test the
  schema internals beyond these two columns; schema ownership is out of scope.

### DBU-060 · Money columns are floating point and require tolerance

- **Covers:** `db_money` — `src/db/utils/db-utils.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** monetary values such as `0.1`, `0.2`, `19.99`, and a computed sum
- **When** they are stored and read back
- **Then** the values round-trip within a documented tolerance, and any sum or
  comparison in tests uses a tolerance rather than exact equality
- **Notes:** `db_money` is SQLite `REAL`, so `0.1 + 0.2` is not `0.3`. This is a
  design risk for pharmacy pricing. The open question for the owner: should money
  be stored as integer minor units or as a decimal string before billing features
  are built? Do not add a rounding convention silently.

## SQL expression helpers

### DBU-061 · Coalesce returns the first non-null value

- **Covers:** `coalesce` — `src/db/sql-helpers.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a row with a null first column and a non-null second, plus a row where
  all columns are null
- **When** the coalesce expression is selected
- **Then** the first row returns the second value and the all-null row returns
  `null`
- **Notes:** execute against in-memory SQLite; string inspection of the generated
  SQL alone does not prove evaluation order.

### DBU-062 · JSON objects preserve keys and values

- **Covers:** `jsonObject` — `src/db/sql-helpers.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a selection of columns including null values
- **When** `jsonObject` is selected and parsed
- **Then** the result object has exactly the requested keys in order with matching
  values, and nulls survive as null
- **Notes:** keys are bound parameters, not interpolated text, in the generated
  SQL. The alias shape is part of query results and must stay stable.

### DBU-063 · Grouped JSON arrays parse text into arrays

- **Covers:** `jsonGroupArray` — `src/db/sql-helpers.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** several child rows joined to a parent and grouped
- **When** the aggregate is selected
- **Then** the result is a JavaScript array of parsed objects with the grouped
  keys, not a JSON string
- **Notes:** SQLite returns text; the helper's `mapWith` is the parsing boundary.
  A caller receiving a string would double-encode the response.

### DBU-064 · A group with no matching children yields an empty array

- **Covers:** `jsonGroupArray` (`FILTER` clause) — `src/db/sql-helpers.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a parent whose only child column is null (for example a left join with
  no match)
- **When** the aggregate is selected
- **Then** the result is `[]`, not `[{}]`, `null`, or the string `"[]"`
- **Notes:** this is the difference between an empty relation and a phantom row;
  UI code maps over the result without extra guards.

### DBU-065 · The distinct aggregation branch is either exposed or removed

- **Covers:** `buildJsonGroupArray` (`distinct` parameter) —
  `src/db/sql-helpers.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the private builder accepts a `distinct` flag, but no exported helper
  passes `true`
- **When** the module's public surface is inspected and the branch is exercised
  through a public entry point
- **Then** either a public distinct variant exists and is tested, or the unused
  branch is removed
- **Notes:** dead code around a security-sensitive aggregate is a maintenance
  risk. Ambiguity: was a distinct helper intended for `jsonGroupArray`? Ask before
  deleting; if removed, mark this case `Obsolete` and name the replacement.
