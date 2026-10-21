import { describe, expect, test } from "vitest";

import {
  chunkByParams,
  D1_MAX_BOUND_PARAMS,
  insertChunked,
  insertChunkedReturning,
} from "./chunk-by-params";

/**
 * Fake lazy insert query whose compiled param count is `rows * paramsPerRow`.
 * Like a real Drizzle query, it only records in `executed` when awaited, so
 * tests can distinguish statements that actually ran from ones `runChunks`
 * discarded while probing the param limit.
 */
function fakeInsert<TResult>(
  chunk: unknown[],
  paramsPerRow: number,
  executed: unknown[][],
  result?: TResult
) {
  const run = () => {
    executed.push(chunk);
    return result;
  };

  return {
    toSQL: () => ({
      params: Array.from({ length: chunk.length * paramsPerRow }),
    }),
    then: (onFulfilled?: (value: TResult) => unknown) =>
      Promise.resolve(run()).then(onFulfilled as never),
  } as unknown as PromiseLike<TResult> & {
    toSQL: () => { params: unknown[] };
  };
}

describe("chunkByParams", () => {
  test("returns no chunks for empty input", () => {
    expect(chunkByParams([], 4)).toEqual([]);
  });

  test("keeps all rows in one chunk when they fit the param limit", () => {
    const rows = Array.from({ length: 10 }, (_, index) => index);

    expect(chunkByParams(rows, 4)).toEqual([rows]);
  });

  test("splits rows into chunks sized by the param limit", () => {
    const rows = Array.from(
      { length: D1_MAX_BOUND_PARAMS + 5 },
      (_, index) => index
    );

    const chunks = chunkByParams(rows, 2);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(D1_MAX_BOUND_PARAMS / 2);
    expect(chunks[1]).toHaveLength(D1_MAX_BOUND_PARAMS / 2);
    expect(chunks[2]).toHaveLength(5);
    expect(chunks.flat()).toEqual(rows);
  });

  test("uses a chunk size of at least one row", () => {
    const rows = [1, 2, 3];

    expect(chunkByParams(rows, D1_MAX_BOUND_PARAMS + 1)).toEqual([
      [1],
      [2],
      [3],
    ]);
  });
});

describe("insertChunked", () => {
  test("does nothing for empty input", async () => {
    const executed: unknown[][] = [];

    await insertChunked([], (chunk) => fakeInsert(chunk, 4, executed));

    expect(executed).toEqual([]);
  });

  test("does not split when the compiled params fit the limit", async () => {
    const rows = Array.from({ length: 20 }, (_, index) => index);
    const executed: unknown[][] = [];

    await insertChunked(rows, (chunk) => fakeInsert(chunk, 4, executed));

    expect(executed).toEqual([rows]);
  });

  test("splits until each executed statement fits the limit", async () => {
    // 240 params > 100, so `runChunks` halves until every chunk fits.
    const rows = Array.from({ length: 60 }, (_, index) => index);
    const executed: unknown[][] = [];

    await insertChunked(rows, (chunk) => fakeInsert(chunk, 4, executed));

    expect(executed).toEqual([
      rows.slice(0, 15),
      rows.slice(15, 30),
      rows.slice(30, 45),
      rows.slice(45, 60),
    ]);
  });
});

describe("insertChunkedReturning", () => {
  test("collects and flattens results across chunks", async () => {
    const rows = Array.from({ length: 60 }, (_, index) => index);
    const executed: unknown[][] = [];

    const results = await insertChunkedReturning(rows, (chunk) =>
      fakeInsert(chunk, 4, executed, chunk)
    );

    expect(results).toEqual(rows);
  });

  test("keeps a single oversized row as-is", async () => {
    const executed: unknown[][] = [];
    const rows = [["huge"]];

    const results = await insertChunkedReturning(rows, (chunk) =>
      fakeInsert(chunk, D1_MAX_BOUND_PARAMS * 2, executed, chunk)
    );

    expect(results).toEqual(rows);
    expect(executed).toEqual([rows]);
  });
});
