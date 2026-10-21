# Database Seeding — Test Implementation

Scope: `src/db/seed/**` — reference data for roles and permissions, role-permission
assignment, development user generation, table clearing, the Wrangler-based seed
connection, and the two seed entry points. Seeds are destructive by design: every
entry point clears tables first. The production entry point must never be pointed
at a database whose contents matter without an explicit decision (SEED-027).

## Source map

| File                                 | Responsibility                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `src/db/seed/seed.config.ts`         | Target row counts for seeded entities (only `users` is consumed today)            |
| `src/db/seed/seed-db.client.ts`      | Opens a local or remote D1 database through Wrangler and returns a Drizzle client |
| `src/db/seed/seed-utils.ts`          | Faker-based date/amount helpers and chunked insert re-exports                     |
| `src/db/seed/clearAll.ts`            | Deletes data from every table in foreign-key-safe order                           |
| `src/db/seed/roles.seed.ts`          | System role definitions and the role insert                                       |
| `src/db/seed/permission.seed.ts`     | Permission catalog and the permission insert                                      |
| `src/db/seed/rolePermission.seed.ts` | Role-to-permission matrix and assignment insert                                   |
| `src/db/seed/dev-seed/user.seed.ts`  | Fixed and randomized development users with credential accounts and user roles    |
| `src/db/seed/dev-seed/index.ts`      | Development seed orchestration, summary logging, disposal, exit codes             |
| `src/db/seed/prod-seed/index.ts`     | Production seed orchestration for reference data only                             |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 29     |
| **Total**   | **29** |

Existing test files: none. No test currently imports `src/db/seed/**`; the chunking
behavior the seeds rely on is covered separately in `db-utils.md`.

## Test environment

- **Unit:** reference-data arrays, the role-permission matrix builder, and the
  date/amount helpers can be tested without a database. Mock the Drizzle client
  with a chainable spy to assert call order for `clearAll`.
- **Integration:** seed functions accept a `DatabaseType` (Drizzle over D1). Use a
  disposable local D1 database with migrations applied and clear it between cases,
  or the Miniflare binding described in `db-infrastructure.md`. No seed harness
  exists at this baseline; adding one is a prerequisite for the persistence cases,
  not a reason to mock away the database.
- **Never** run `seed-db.client.ts` with `SEED_REMOTE=true` in tests. Cases that
  inspect remote/local option selection must stub the Wrangler proxy function.
- **Determinism:** call `faker.seed(<constant>)` before any generation, freeze
  `Date.now` for `daysAgo`/`banExpires`, and stub `crypto.randomUUID` when ids are
  asserted. Password hashing is intentionally salted/non-deterministic: verify the
  password with the hash rather than comparing hash strings across runs (SEED-015).
- **Auth/permissions:** seeds create role and permission rows but do not evaluate
  permissions. No auth mocking is needed; the permission matrix cases assert data,
  not authorization decisions.
- **Money:** none of the seeded entities currently carry money. `seedConfigs`
  mentions future entities; see SEED-029.

## Reference data

### SEED-001 · Role seed data covers every system role exactly once

- **Covers:** `rolesData` — `src/db/seed/roles.seed.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the exported role array
- **When** it is inspected
- **Then** it has four entries whose `roleName` values are `USER`,
  `SUPPORT_AGENT`, `ADMIN`, and `SUPER_ADMIN`, each exactly once, all valid
  `RoleEnum` values, and each has a non-empty description
- **Notes:** a duplicated or missing role breaks permission assignment for every
  user of that role.

### SEED-002 · The system-role allow-list mirrors the role seed data

- **Covers:** `SYSTEM_ROLES` — `src/db/seed/roles.seed.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `SYSTEM_ROLES` and `rolesData`
- **When** both are compared as sets and as sequences
- **Then** they contain the same four role names in the same order
- **Notes:** `seedUsers` filters roles through this list before creating users. A
  mismatch silently drops a role from user assignment.

### SEED-003 · The permission catalog has unique, valid triples

- **Covers:** `permissionsData` — `src/db/seed/permission.seed.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the exported permission array
- **When** it is validated
- **Then** it has 18 entries, every `level`/`resource`/`action` is a valid enum
  value, and no `(level, resource, action)` triple repeats
- **Notes:** the table has a unique index on the triple; a duplicate would abort the
  seed midway after earlier tables were already cleared.

### SEED-004 · The permission catalog covers the intended scope split

- **Covers:** `selfPermissions`, `systemPermissions` —
  `src/db/seed/permission.seed.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the combined catalog
- **When** entries are grouped
- **Then** there are 2 `self` permissions (own user read/update), 16 `system`
  permissions, and per-resource totals of 8 `user`, 6 `role_permission`, and 4
  `report`
- **Notes:** these counts are the seed's authorization surface. A new resource
  should update this case intentionally, not break it accidentally.

### SEED-005 · Seeding permissions inserts the whole catalog and returns it

- **Covers:** `seedPermission` — `src/db/seed/permission.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** an empty database with migrations applied
- **When** `seedPermission` runs
- **Then** 18 rows exist in the permission table, the returned array has 18 typed
  records with generated ids, and every source triple is present
- **Notes:** 18 rows at four parameters each stays under the D1 bound-parameter
  limit; the case also proves the chunked insert path used by the seed works.

### SEED-006 · Re-seeding permissions without clearing fails on the unique key

- **Covers:** `seedPermission` — `src/db/seed/permission.seed.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a database that already contains the seeded permissions
- **When** `seedPermission` runs a second time without `clearAll`
- **Then** the insert rejects with a uniqueness violation and the existing rows are
  unchanged
- **Notes:** documents that the function is not idempotent. Orchestrators must
  clear first; do not "fix" this by adding upserts without an owner decision.

### SEED-007 · The role-permission matrix assigns the documented counts

- **Covers:** `rolesAndPermissionData`, `seedRolePermission` —
  `src/db/seed/rolePermission.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** seeded roles and permissions
- **When** role-permission rows are generated
- **Then** `USER` receives 2, `SUPPORT_AGENT` 2, `ADMIN` 6, and `SUPER_ADMIN` 8
  assignments (18 rows total), and every row references an existing role and
  permission
- **Notes:** super admin inherits admin's permissions by spreading them and adds
  user management and role-permission management. It does not receive an explicit
  "everything" row.

### SEED-008 · Assignment matches permissions by triple, not by id

- **Covers:** `seedRolePermission` — `src/db/seed/rolePermission.seed.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** permission records whose ids are shuffled or replaced with different
  UUIDs but whose triples are unchanged
- **When** assignments are generated
- **Then** the same role→permission pairs result, each using the current ids
- **Notes:** matching by id would couple the seed to insertion order.

### SEED-009 · A role absent from the database is skipped

- **Covers:** `seedRolePermission` — `src/db/seed/rolePermission.seed.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a role list missing `ADMIN`
- **When** assignments are generated
- **Then** no rows are produced for `ADMIN`, the other roles are unaffected, and
  the function does not throw
- **Notes:** the seed logs an assignment line for every configured role regardless;
  only the returned rows are the contract.

### SEED-010 · The `manage` action is stored, not expanded

- **Covers:** `rolesAndPermissionData` — `src/db/seed/rolePermission.seed.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the seeded admin and super-admin entries that use `manage`
- **When** assignments are generated
- **Then** only the `manage` permission row is assigned; no `create`/`read`/
  `list`/`update`/`delete`/`export` rows are synthesized
- **Notes:** comments call `manage` a wildcard, but no permission-evaluation code
  exists at this commit. Ambiguity for the owner: will `manage` expand at
  evaluation time or should the seed materialize every action? Settle this before
  building authorization; do not encode expansion in seed tests.

## Clearing and orchestration

### SEED-011 · Clearing deletes join and child tables before parents

- **Covers:** `clearAll` — `src/db/seed/clearAll.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a spy Drizzle client that records each delete target
- **When** `clearAll` runs
- **Then** the call order is user-role and role-permission joins, then user events,
  user sessions, user devices, accounts, sessions, verifications, addresses,
  users, roles, and permissions
- **Notes:** foreign keys are enforced in D1. Reordering the first four deletes can
  make the seed fail before it starts. Assert order, not just membership.

### SEED-012 · Clearing removes data from every domain table

- **Covers:** `clearAll` — `src/db/seed/clearAll.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** the schema's table list
- **When** `clearAll` runs
- **Then** exactly 12 delete statements execute, one per table, with no `TRUNCATE`
  and no table left populated
- **Notes:** if a new table is added to the schema, this case and `clearAll` must be
  updated together; otherwise remnants survive a reseed.

### SEED-013 · The development seed creates the configured number of users

- **Covers:** `seedUsers`, `seedConfigs` — `src/db/seed/dev-seed/user.seed.ts`,
  `src/db/seed/seed.config.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** seeded roles and a user target of 50
- **When** `seedUsers` runs
- **Then** 50 user rows exist: the 4 fixed users plus 46 generated users, and the
  returned array contains all 50 with ids
- **Notes:** freeze Faker and the clock; do not assert generated names. The target
  comes from `seedConfigs.targets.users`.

### SEED-014 · The four fixed users keep their documented identity

- **Covers:** `DEFAULT_USERS` — `src/db/seed/dev-seed/user.seed.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the development seed
- **When** users are created
- **Then** `user@mail.com`, `super_agent@mail.com`, `admin@mail.com`, and
  `superadmin@mail.com` exist once each with roles `USER`, `SUPPORT_AGENT`,
  `ADMIN`, and `SUPER_ADMIN`, verified email, and a deterministic DiceBear avatar
- **Notes:** these are the login fixtures developers rely on. The shared password is
  covered by SEED-015.

### SEED-015 · Every seeded user has a working credential account

- **Covers:** `seedUsers` (accounts) — `src/db/seed/dev-seed/user.seed.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** 50 seeded users and the documented password `12345678`
- **When** the credential account rows are inspected and the password is verified
  against one stored hash
- **Then** there is exactly one `credential` account per user with
  `accountId === userId`, and the password verifies successfully
- **Notes:** hashing is salted; never compare hash strings across runs. A missing
  account means the fixed login users cannot sign in.

### SEED-016 · Every seeded user is linked to their role join row

- **Covers:** `seedUsers` (user roles) — `src/db/seed/dev-seed/user.seed.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** users created with roles
- **When** the user-role join table is read
- **Then** each user has exactly one join row pointing at the role with the same
  name as the user's `role` column
- **Notes:** the user table duplicates the role name while the join table carries
  the role id. A mismatch would make permission lookups disagree with the UI.

### SEED-017 · Banned generated users have consistent ban metadata

- **Covers:** `createRandomUser`, `RANDOM_USER_CONFIG` —
  `src/db/seed/dev-seed/user.seed.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a deterministic Faker seed that produces both banned and active users
- **When** generated users are read back
- **Then** every banned user has a non-null reason and a future expiration, every
  non-banned user has null reason and expiration, and the fixed users are never
  banned
- **Notes:** the 20% ban probability is random. Assert the invariant, not the exact
  count, unless Faker is seeded and the count is confirmed stable.

### SEED-018 · Generated users satisfy the insert contract

- **Covers:** `createRandomUser` — `src/db/seed/dev-seed/user.seed.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a generated user object and the insert schema
- **When** the object is validated
- **Then** it parses successfully, has a unique email, a non-empty name, a valid
  role name, and settings fields (`timezone`, `locale`, `currency`) that are
  non-empty strings
- **Notes:** ambiguity: `locale` is filled from a two-letter country code
  (`faker.location.countryCode("alpha-2")`), not a BCP-47 locale such as `en-US`.
  Decide whether that is acceptable test data before adding formatting features
  that read `locale`. Keep the case broad enough to survive the fix.

### SEED-019 · Seeding users without their roles fails clearly

- **Covers:** `seedUsers`, `buildDefaultUsersData` —
  `src/db/seed/dev-seed/user.seed.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a role list that omits one of the four system roles
- **When** `seedUsers` runs
- **Then** it rejects before inserting any user, with an error naming the missing
  role rather than an unhelpful non-null assertion failure
- **Notes:** current code uses `roles.find(...)!` and throws a `TypeError` reading
  a property of `undefined`. Write the case for the intended diagnostic; the test
  will be `Missing` until the implementation improves.

### SEED-020 · A target below the fixed-user count still seeds the fixed users

- **Covers:** `seedUsers`, `seedConfigs.targets.users` —
  `src/db/seed/dev-seed/user.seed.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a user target of 2 while 4 fixed users are defined
- **When** the remaining count is computed
- **Then** the remaining count is 0 and the seed still creates the 4 fixed users
- **Notes:** `Math.max(0, target - 4)` prevents negative loops. Assert the fixed
  users are not truncated to the target.

## Seed utilities and connection

### SEED-021 · Day helpers add exact 24-hour spans

- **Covers:** `daysAgo`, `addDays` — `src/db/seed/seed-utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a frozen instant
- **When** `daysAgo(3)` and `addDays(date, 2)` are computed
- **Then** the results are exactly 3 days earlier and 2 days later in
  milliseconds, and the original date is not mutated
- **Notes:** these are elapsed-time helpers, not calendar-day helpers; they ignore
  DST and time zones, which is acceptable for seed data but must not be reused for
  business date math.

### SEED-022 · Split amounts preserve the total

- **Covers:** `splitAmount` — `src/db/seed/seed-utils.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** totals of `0`, `1`, `2`, `10`, and a fractional total such as `19.99`
- **When** `splitAmount` runs under a seeded Faker instance
- **Then** the result is one or two parts, every part is at least 1, the parts sum
  to the input within a tolerance, and totals below 2 always return a single part
- **Notes:** the helper is currently unused but will feed payment splits. For
  fractional inputs the integer split is not cent-safe; if it is used for money,
  require integer minor units and a tolerance assertion.

### SEED-023 · Split amounts are reproducible under a Faker seed

- **Covers:** `splitAmount` — `src/db/seed/seed-utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** two runs with the same Faker seed and the same total
- **When** `splitAmount` is called
- **Then** both runs produce the same split (or both produce a single part)
- **Notes:** proves the function consumes only the seeded generator. Do not assert
  a specific split; that would freeze Faker's algorithm.

### SEED-024 · A missing Wrangler config path is rejected with a clear message

- **Covers:** `seedDbClient` — `src/db/seed/seed-db.client.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `WRANGLER_CONFIG_PATH` unset or empty
- **When** `seedDbClient` is called
- **Then** it rejects with the exact message
  `WRANGLER_CONFIG_PATH must point to an app's wrangler config file` before
  attempting any connection
- **Notes:** without this guard Wrangler would target an unpredictable config.

### SEED-025 · Local and remote connections use different Wrangler options

- **Covers:** `seedDbClient` — `src/db/seed/seed-db.client.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a stubbed platform proxy, first with `SEED_REMOTE` unset and a persist
  path, then with `SEED_REMOTE=true`
- **When** `seedDbClient` runs
- **Then** the local call uses no environment, remote bindings disabled, and the
  given persist path; the remote call uses environment `production`, remote
  bindings enabled, and no persistence
- **Notes:** assert the options passed to Wrangler, not the returned client. This is
  the guard that keeps local tests from touching production D1.

### SEED-026 · The development seed runs steps in dependency order

- **Covers:** `main` — `src/db/seed/dev-seed/index.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** stubbed seed steps and a stubbed connection
- **When** the development entry point runs
- **Then** it clears data, then seeds roles, permissions, role-permission
  assignments, and users in that order; the summary reports the four counts; and
  the connection is disposed
- **Notes:** users depend on roles; assignments depend on both roles and
  permissions. The order is the contract.

### SEED-027 · The production seed never creates users and still clears data

- **Covers:** `main` — `src/db/seed/prod-seed/index.ts`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** stubbed seed steps and a stubbed connection
- **When** the production entry point runs
- **Then** it clears data, seeds roles, permissions, and assignments, and does not
  call user seeding
- **Notes:** `clearAll` runs against the selected environment, including remote
  production. This is destructive. Open question for the owner: should the
  production seed refuse to clear, or require a separate confirmation flag? Do not
  run this case against a real remote database.

### SEED-028 · Entry points always dispose and set the exit code

- **Covers:** `main` — `src/db/seed/dev-seed/index.ts`,
  `src/db/seed/prod-seed/index.ts`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a seed run that succeeds and one that fails mid-way
- **When** the entry point completes
- **Then** the connection is disposed in both cases, success exits `0`, and failure
  prints the error and exits `1`
- **Notes:** spawn the entry point as a subprocess and stub the database boundary;
  do not let `process.exit` terminate the test runner by importing the module.

### SEED-029 · Unused seed targets are documented, not silently implemented

- **Covers:** `seedConfigs` — `src/db/seed/seed.config.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the targets object
- **When** the development seed runs
- **Then** only `users` affects the inserted rows; `vendors`, `customers`,
  `purchases`, `sales`, `purchaseReturns`, and `expenses` remain unused
- **Notes:** these entities do not exist in the schema at this commit. The case
  records them as reserved configuration. When those domains are implemented,
  replace this case with per-domain seed cases and update the owner documents.
