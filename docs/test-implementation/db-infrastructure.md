# Database Infrastructure — Test Implementation

Scope: `src/db/clients/**`, `src/db/generators/**` — creation of the Drizzle D1
client and the two command-line generators that export the schema as DBML and SQL.
The generators run as side-effecting scripts (`pnpm db:generate-dbml`,
`pnpm db:generate-sql`), so they must be verified as processes, not imported into
a unit test. Database schema definitions themselves are out of scope.

## Source map

| File                                  | Responsibility                                                             |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `src/db/clients/drizzle-client.ts`    | Binds a Cloudflare D1 database to Drizzle with the full schema             |
| `src/db/generators/dbml-generator.ts` | Writes `schema.dbml` from the Drizzle schema, including relations          |
| `src/db/generators/sql-generator.ts`  | Runs `drizzle-kit export`, writes `full-schema.sql`, fails on empty output |

## Coverage summary

| Status      | Count |
| ----------- | ----- |
| Implemented | 0     |
| Partial     | 0     |
| Missing     | 5     |
| **Total**   | **5** |

Existing test files: none.

## Test environment

- **Client:** requires a D1-compatible binding. Use Miniflare/wrangler's local D1
  (the project already runs it through `wrangler` for development) or an
  equivalent D1 shim. There is no such harness in the current Vitest setup, so
  client cases are integration tests that need their own setup before they can be
  implemented. Do not mock `drizzle()` itself; that tests nothing.
- **Generators:** both files execute on import. Tests must spawn them with
  `tsx`/`pnpm` in a temporary working directory and inspect the written files and
  exit code. Never import them into the Vitest process.
- **Auth/permissions:** not applicable.
- **Determinism:** schema output depends on the schema files only. If the DBML or
  SQL output contains timestamps or absolute paths, normalize them before
  comparing. Do not snapshot a full generated file; assert structure (tables,
  relations, statements) so unrelated schema additions do not break the test.
- **Money:** not applicable here; see `db-utils.md` DBU-060.

## Client

### DBI-001 · The client uses the supplied binding and exposes the schema

- **Covers:** `createDrizzleClient` — `src/db/clients/drizzle-client.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** a local D1 binding with the migrations applied
- **When** the client is created and a simple schema-aware query runs
- **Then** the query targets the supplied database, returns typed rows, and a
  second call with a different binding does not see the first database's rows
- **Notes:** this proves the binding is not read from a module global. The type
  parameter is erased at runtime; only behavior matters.

### DBI-002 · Two clients over different bindings stay isolated

- **Covers:** `createDrizzleClient` — `src/db/clients/drizzle-client.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** two local D1 databases, each with a distinguishable row
- **When** two clients are created and queried
- **Then** each client sees only its own row
- **Notes:** relevant to request-scoped clients in the Workers runtime. If the
  application later creates one client per request, this is the safety property.

## Generators

### DBI-003 · The DBML generator writes the complete schema file

- **Covers:** `dbml-generator` — `src/db/generators/dbml-generator.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a temporary working directory containing the project configuration
- **When** `pnpm db:generate-dbml` runs
- **Then** `schema.dbml` is created in that directory, contains every table in
  `src/db/schemas`, and includes the declared relations
- **Notes:** the script writes to `process.cwd()`. Run it in a temp directory and
  compare a normalized list of table names, not the full file. This is
  developer-tooling coverage, not application behavior.

### DBI-004 · The SQL generator writes exported DDL

- **Covers:** `sql-generator` — `src/db/generators/sql-generator.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a working repository checkout and the configured drizzle-kit config
- **When** `pnpm db:generate-sql` runs
- **Then** `full-schema.sql` exists at the repository root, contains `CREATE TABLE`
  statements for the schema, and the process exits with code `0`
- **Notes:** the script prints a size line; do not assert its exact number. The
  file is generated output and must not be hand-edited.

### DBI-005 · Empty export output fails the SQL generator

- **Covers:** `exportDrizzleSQL` — `src/db/generators/sql-generator.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a stubbed `drizzle-kit` command that exits successfully but prints
  nothing, or exits non-zero
- **When** the generator runs
- **Then** it reports the failure, does not write an empty `full-schema.sql`, and
  exits non-zero
- **Notes:** an empty schema export silently replaces a valid file and breaks
  downstream documentation. Because the child process is spawned through a shell
  string, keep the stub on `PATH` or in a temp workspace; do not modify the
  developer's global tooling.
