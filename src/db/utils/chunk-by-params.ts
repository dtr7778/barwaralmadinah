/** D1 allows at most 100 bound parameters per statement. */
export const D1_MAX_BOUND_PARAMS = 100;

type InsertQuery<TResult = unknown> = {
  toSQL: () => { params: unknown[] };
} & PromiseLike<TResult>;

/**
 * Split rows into chunks that each stay within D1's bound-parameter limit.
 *
 * `paramsPerRow` is the number of bound parameters a single row contributes to
 * the compiled statement. Each chunk is sized as
 * `floor(D1_MAX_BOUND_PARAMS / paramsPerRow)` (at least 1), which makes this
 * suitable for building multi-row inserts or `IN (...)` clauses safely.
 */
export function chunkByParams<T>(
  rows: Array<T>,
  paramsPerRow: number
): Array<Array<T>> {
  const chunkSize = Math.max(1, Math.floor(D1_MAX_BOUND_PARAMS / paramsPerRow));
  const chunks: Array<Array<T>> = [];

  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }

  return chunks;
}

/**
 * Run an insert builder over `rows`, splitting the batch until each compiled
 * statement fits D1's bound-parameter limit. Unlike {@link chunkByParams}, the
 * split is based on the actual compiled parameter count, so it adapts to the
 * query shape instead of an estimated `paramsPerRow`.
 */
async function runChunks<T, TResult>(
  rows: T[],
  build: (chunk: T[]) => InsertQuery<TResult>,
  collect: (result: TResult) => void
): Promise<void> {
  if (rows.length === 0) return;

  const query = build(rows);

  // A single row is sent as-is even if it cannot fit.
  if (rows.length === 1 || query.toSQL().params.length <= D1_MAX_BOUND_PARAMS) {
    collect(await query);
    return;
  }

  const mid = Math.ceil(rows.length / 2);
  await runChunks(rows.slice(0, mid), build, collect);
  await runChunks(rows.slice(mid), build, collect);
}

/** Insert rows in D1-safe chunks, discarding the results. */
export async function insertChunked<T>(
  rows: T[],
  build: (chunk: T[]) => InsertQuery
): Promise<void> {
  await runChunks<T, unknown>(rows, build, () => {});
}

/** Insert rows in D1-safe chunks and collect the returned rows. */
export async function insertChunkedReturning<T, TResult>(
  rows: T[],
  build: (chunk: T[]) => InsertQuery<TResult[]>
): Promise<TResult[]> {
  const results: TResult[] = [];

  await runChunks<T, TResult[]>(rows, build, (result) => {
    results.push(...result);
  });

  return results;
}
