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

## Things to Avoid

- Don't edit generated files (`routeTree.gen.ts`, `worker-configuration.d.ts`) or `graphify-out/`.
- Don't rewrite existing migration files. Add a new migration only after the user says "generate migration".
- Don't generate a migration when you change any database table without asking first. Always ask permission.
- Don't commit `.env*` files or secrets.
