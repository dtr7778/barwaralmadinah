# AGENT.md

Guidance for AI coding agents working in the Jorna Pharmacy repo.

## Knowledge Graph (graphify)

A knowledge graph of this repo lives in `graphify-out/` (`graph.json`, `GRAPH_REPORT.md`, `graph.html`). Use it for architecture and file-relationship questions:

- Query: `graphify query "<question>"`
- Shortest path between concepts: `graphify path "<A>" "<B>"`
- Explain a node: `graphify explain "<Node>"`
- Rebuild after code changes (no API cost): `graphify update .`

Caveats:

- The report was built from commit `0c96b323`. Check `git rev-parse HEAD` before relying on it, and rebuild if the code has changed.
- The graph includes `.opencode/skills/` (agent skill content) and generated type files such as `worker-configuration.d.ts`. These are not application code, so filter them out when reasoning about the app.
- `graphify-out/` is generated output. Do not edit it by hand.

## Testing

- Run `pnpm test` before claiming work is complete. Run `pnpm typecheck` and `pnpm lint` for code changes.
- Unit tests are `src/**/*.{test,spec}.{ts,tsx}`, run with Vitest in jsdom with Testing Library. Global setup is in `test/setup.ts`.
- Storybook stories (`*.stories.tsx`) are tested through the Storybook Vitest addon in a headless Chromium browser (Playwright).

## Test Implementation Docs

`docs/test-implementation/` is the living specification of every test the project should
have. `main-test-implementation.md` holds global rules and links; one child document per
code area holds the cases.

**This is mandatory work, not optional documentation.** Whenever you create, change,
rename, or delete application code, you must update the owning test-implementation
document in the same change:

1. Find the owning child document using the index in
   `docs/test-implementation/main-test-implementation.md`. If none exists, create one and
   link it from the index.
2. Add cases for new behavior, update cases for changed behavior, and mark removed
   behavior `Obsolete`. Keep IDs stable; never renumber or reuse an ID.
3. Verify each case's `Status` against the real test files: `Implemented` only when a
   test asserts the described outcome, `Partial` when incomplete, otherwise `Missing`.
4. Update the document's coverage summary counts.
5. Record any new test file in the document's source map.

Rules for the documents:

- Docs only. Never put runnable test code in `docs/test-implementation/`.
- Describe observable behavior, inputs, and expected outcomes, not implementation
  details that would break on refactor.
- Test code itself still lives next to the source (`src/**/*.test.ts[x]`).
- `src/db/schemas/**` is intentionally out of scope for these docs.
- Developers may edit the docs, but agents are responsible for keeping them in sync.
  A code change that leaves them stale is incomplete.

Before finishing any code change, confirm the owning document was checked and updated.

## Things to Avoid

- Don't edit generated files (`routeTree.gen.ts`, `worker-configuration.d.ts`) or `graphify-out/`.
- Don't rewrite existing migration files. Add a new migration only after the user says "generate migration".
- Don't generate a migration when you change any database table without asking first. Always ask permission.
- Don't commit `.env*` files or secrets.
