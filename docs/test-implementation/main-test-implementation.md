# Test Implementation Specification

This directory is the living test specification for the Jorna Pharmacy application
(TanStack Start + TanStack Router, React 19, Drizzle + Cloudflare D1, better-auth,
Vitest + Testing Library). It states what the system must prove, area by area, so
that tests can be written, reviewed, and audited against intended behavior rather
than against current implementation details.

Baseline: commit `c313691e3e0bb04244ea170e5ff9aa0361e40f77` (2026-10-21). The
repository at this commit is a scaffold: i18n, routing, head metadata, shared
library helpers, database query/seed utilities, one UI primitive, and the Drizzle
schema. None of the business domains named in the authoring prompt (medicine,
purchase, sales, customers, vendors, reports) exist yet, so no cases are invented
for them. When those domains are added, add new child documents and extend the
index; do not rewrite this file's history.

## Ownership and update rule

Every non-test application source file has exactly one owning child document (see
the document index). The owner is responsible for the cases that describe that
file's behavior.

- A code change and the owning document change must land in the same commit or
  pull request. "Docs later" is not acceptable.
- Adding a source file requires adding it to exactly one `## Source map` and,
  where behavior is testable, adding cases.
- Changing behavior requires updating the affected cases (Given/When/Then) and
  re-checking their status.
- Deleting or replacing behavior requires marking the old case `Obsolete` and
  adding replacement cases with new IDs.
- Never edit a child document that does not own the file you changed; add a
  cross-link instead.
- Generated output and schema files are out of scope (see below); do not create
  cases for them.

## Global rules

1. **Docs, not code.** These documents contain no imports, no runnable examples,
   and no copy-pasteable test blocks. Describe behavior in prose bullets.
2. **One owner per file.** A file appears in exactly one source map. If a file is
   relevant to several areas, the closest domain owns it and other documents
   cross-link to it.
3. **Evidence-based status.** A case is `Implemented` only when a real test in the
   repository asserts the described outcome. If assertions cover only part of the
   outcome, use `Partial`. Otherwise use `Missing`. Never mark a case
   `Implemented` because the code "obviously works".
4. **Status vocabulary.**

   | Status        | Meaning                                                               |
   | ------------- | --------------------------------------------------------------------- |
   | `Implemented` | A committed test asserts the full described outcome.                  |
   | `Partial`     | A committed test asserts part of the outcome, or only a trivial path. |
   | `Missing`     | No committed test asserts the outcome.                                |
   | `Obsolete`    | The behavior was removed or replaced; the ID stays reserved.          |

5. **Priority vocabulary.**

   | Priority | Meaning                                                           |
   | -------- | ----------------------------------------------------------------- |
   | `P0`     | Data loss, authentication/authorization, money, or the core flow. |
   | `P1`     | Main behavior a user or caller depends on.                        |
   | `P2`     | Edge cases, formatting, visual polish, and developer experience.  |

6. **Test-type vocabulary.** `unit` (pure functions, builders, config),
   `integration` (D1/Drizzle, server functions, seed against a database),
   `component` (React rendering and interaction), `story` (Storybook), `e2e`
   (browser-level flow). Storybook is not configured at this baseline; use
   `component` until it is.
7. **IDs are stable.** Never renumber, never reuse an ID, never re-purpose an ID
   for different behavior. Append new cases with the next free number.
8. **Behavior over implementation.** A case must survive a refactor of internals.
   Describe inputs and observable outputs; avoid naming private helpers, call
   counts, or internal data structures unless they are part of the contract.
9. **Cover the contract.** When a case concerns a public entry point (function,
   server function, route, component prop), state success, validation failure,
   and the relevant unauthorized/not-found behavior separately. When oRPC
   procedures are added, each one needs contract cases (input and output schema),
   plus success, validation failure, unauthenticated, forbidden, and not-found
   behavior as applicable.
10. **Money is real.** Any monetary assertion must use tolerance
    (`toBeCloseTo`, explicit epsilon, or integer minor units). Never use exact
    floating-point equality. The schema currently stores money as SQLite `REAL`
    (see `db-utils.md`), so rounding behavior must be made explicit before money
    features are built.
11. **Dates and IDs are injected.** Tests must not depend on the wall clock or on
    random UUIDs. Freeze time with fake timers (`vi.useFakeTimers`,
    `vi.setSystemTime`), seed Faker (`faker.seed`), and stub
    `crypto.randomUUID` where identity matters.
12. **Test command.** The canonical command is `pnpm test` (`vitest run`).
    Component tests run in jsdom with `src/test/setup.ts`; see each child
    document's test environment section.
13. **No speculative coverage.** If intended behavior cannot be determined from
    code, contracts, routes, or UI, write the case as `Missing` and record the
    open question in `Notes`.

## Test case format

Every case uses this shape:

- Heading: `### PREFIX-000 · Short behavior-focused name`
- `Covers:` the exported symbol and its file, using backticks.
- `Type:` one test type, `Priority:` one priority, `Status:` one status.
- `Given` the starting state and fixtures.
- `When` the single behavior under test runs.
- `Then` the observable outcome, with exact strings or values where stable.
- `Notes` only when fixtures, mocks, ambiguity, or follow-up decisions exist.

Illustrative shape only (not runnable, not a real case):

`EXAMPLE-001 · Reject a page number below one` — covers `buildPagination`
in `src/example.ts`; type unit, priority P1, status Missing. Given a requested
page of `0`, when pagination options are built, then the effective page is `1`
and the offset is `0`, with a note recording which caller is expected to
normalize input.

Order cases by importance inside a themed section: core flow first, edge cases
last.

## When a test is implemented

1. Write the test next to the source as `src/**/*.test.ts` or `*.test.tsx`.
2. Change the case status from `Missing`/`Partial` to `Implemented` only for the
   outcome the test actually asserts.
3. Add the new file to the owning document's `Existing test files` list with a
   one-line description of what it covers.
4. Update the document's coverage summary and the baseline table in this file.
5. If the test reveals an unspecified behavior, add a new case for it. Do not
   widen an existing case to absorb new assertions.
6. Record a verification command and date only when you actually ran it.

## When code is deleted or replaced

- Change the case status to `Obsolete`; keep the ID and the heading.
- Add one sentence naming the replacement case IDs, or `none` when behavior is
  intentionally gone.
- Add replacement cases with fresh IDs; never recycle the obsolete number.
- Remove the obsolete source file from the source map only after the replacement
  owner is recorded.

## Document index

| Area                               | Document                                       | Source scope                                             |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Internationalization (`I18N`)      | [i18n.md](./i18n.md)                           | `src/i18n/**`, `src/types/app-config.d.ts`               |
| Routing and app shell (`RTE`)      | [routes.md](./routes.md)                       | `src/router.tsx`, `src/routes/**`                        |
| Head metadata (`HEAD`)             | [head.md](./head.md)                           | `src/lib/head/**`                                        |
| Shared library and env (`LIB`)     | [lib.md](./lib.md)                             | `src/constants/**`, `src/lib/env.ts`, `src/lib/utils.ts` |
| UI primitives (`UI`)               | [components-ui.md](./components-ui.md)         | `src/components/ui/**`                                   |
| Database query utilities (`DBU`)   | [db-utils.md](./db-utils.md)                   | `src/db/utils/**`, `src/db/sql-helpers.ts`               |
| Database infrastructure (`DBI`)    | [db-infrastructure.md](./db-infrastructure.md) | `src/db/clients/**`, `src/db/generators/**`              |
| Database seeding (`SEED`)          | [db-seed.md](./db-seed.md)                     | `src/db/seed/**`                                         |
| Design tokens and styles (`STYLE`) | [styles.md](./styles.md)                       | `src/styles.css`                                         |

Coverage at the baseline commit:

| Area                     | Implemented | Partial | Missing | Obsolete | Total   |
| ------------------------ | ----------- | ------- | ------- | -------- | ------- |
| Internationalization     | 0           | 0       | 18      | 0        | 18      |
| Routing and app shell    | 0           | 0       | 14      | 0        | 14      |
| Head metadata            | 0           | 0       | 23      | 0        | 23      |
| Shared library and env   | 0           | 0       | 8       | 0        | 8       |
| UI primitives            | 1           | 0       | 7       | 0        | 8       |
| Database query utilities | 10          | 1       | 54      | 0        | 65      |
| Database infrastructure  | 0           | 0       | 5       | 0        | 5       |
| Database seeding         | 0           | 0       | 29      | 0        | 29      |
| Design tokens and styles | 0           | 0       | 5       | 0        | 5       |
| **Total**                | **11**      | **1**   | **163** | **0**    | **175** |

Eleven `Implemented` cases plus one `Partial` case account for the twelve passing
tests present at this commit (`pnpm test`: 4 files, 12 tests, run on 2026-10-21).
The `Partial` case maps to a test whose matcher asserts only a subset of the
documented outcome.

## Out of scope

- `src/db/schemas/**` — tables, enums, relations, column helpers, and drizzle-zod
  schemas. They are documented only where a behavior case needs them (for
  example seed identity), never tested for schema internals.
- Generated files: `src/routeTree.gen.ts`, `worker-configuration.d.ts`,
  `graphify-out/**`, `full-schema.sql`, `schema.dbml`, and `migrations/**`.
- Test harness: `src/test/setup.ts`, `vitest.config.ts`, `vite.config.ts`.
  Harness behavior is stated in each document's test environment section.
- Root tooling configuration (`eslint.config.js`, `drizzle*.config.ts`,
  `wrangler*.jsonc`, `tsconfig.json`, `package.json`) unless a behavior case
  depends on it.
- Static assets under `public/**`, fonts, and images.
- Thin third-party wrappers with no project-specific behavior. The one mapped
  wrapper, `src/lib/utils.ts`, is kept in `lib.md` because it is the styling
  contract used by every UI primitive.
- Business domains not yet present in the repository at the baseline commit.
  Do not write placeholders for them.

## Maintenance checklist

Use this list in every change that touches application source or tests:

- [ ] Owning child document updated in the same change.
- [ ] Cases added for new behavior; existing cases updated for changed behavior.
- [ ] Removed behavior marked `Obsolete` with a replacement reference.
- [ ] Every `Implemented` status verified against a committed test.
- [ ] Source map updated (added, moved, or deleted files).
- [ ] Coverage summary and the baseline table in this file recomputed.
- [ ] `pnpm test` run and its result recorded, not assumed.
- [ ] For code changes: `pnpm typecheck` and `pnpm lint` run and reported.
- [ ] No runnable test code pasted into these documents.
- [ ] New child document linked from the index with its ID prefix listed.
