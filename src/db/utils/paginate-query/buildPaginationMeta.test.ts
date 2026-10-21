import { describe, expect, test } from "vitest";

import { buildPaginationMeta } from "./buildPaginationMeta";

describe("buildPaginationMeta", () => {
  test("should build paginate meta", () => {
    const totalCount = 100;
    const queryCount = 50;
    const page = 1;
    const limit = 10;

    const meta = buildPaginationMeta(totalCount, queryCount, page, limit);

    expect(meta).toEqual({
      isFirstPage: true,
      isLastPage: false,
      currentPage: page,
      previousPage: null,
      nextPage: page + 1,
      pageCount: queryCount / limit,
      queryCount,
      totalCount,
    });
  });
});
