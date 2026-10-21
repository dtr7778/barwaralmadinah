# Shared Library and Environment — Test Implementation

Scope: `src/constants/**`, `src/lib/env.ts`, `src/lib/utils.ts` — brand constants,
validated environment configuration, and the class-name helper re-exported for UI
primitives. The environment module is evaluated at import time, so tests must
control the process/runtime environment before importing it. Cloudflare bindings
(such as `DB`) are not part of this module; they arrive through the request
context and must not be added here.

## Source map

| File                     | Responsibility                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| `src/constants/index.ts` | Brand theme and background colors used by metadata and styling    |
| `src/lib/env.ts`         | Import-time validation of server and client environment variables |
| `src/lib/utils.ts`       | Re-export of the `cn` class-name merger used by UI primitives     |

## Coverage summary

| Status      | Count |
| ----------- | ----- |
| Implemented | 0     |
| Partial     | 0     |
| Missing     | 8     |
| **Total**   | **8** |

Existing test files: none. No test currently imports these modules (the `cn`
behavior is exercised indirectly by `src/components/ui/button.test.tsx`, but that
test does not assert class merging).

## Test environment

- **Unit:** constants and the class-name merger need no setup. The env module
  must be imported dynamically after the environment is prepared, with module
  state reset between cases, because `createEnv` runs once per module instance.
- **Environment selection:** the module chooses `process.env` when `window` is
  undefined and `import.meta.env` otherwise. Run server-variable cases in a Node
  test environment and client-variable cases in jsdom, or document the chosen
  runtime in the test file name. Do not assert both runtimes in one import.
- **Required client fixtures:** `VITE_APP_NAME`, `VITE_SITE_URL` (a valid URL),
  `VITE_SYSTEM_MAIL`, and `VITE_SUPPORT_MAIL` (valid emails). Provide all four,
  then remove or corrupt one per negative case.
- **Auth/permissions:** not applicable.
- **Determinism:** no clock, randomness, or network. Filesystem and process env
  are the only external state.
- **Money:** not applicable.

## Constants

### LIB-001 · Brand colors are the documented values

- **Covers:** `THEME_COLOR`, `BACKGROUND_COLOR` — `src/constants/index.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the constants module is imported
- **When** the two color constants are read
- **Then** `THEME_COLOR` is exactly `#5E381D` and `BACKGROUND_COLOR` is exactly
  `#F5EBDD`, both uppercase six-digit hex values
- **Notes:** `THEME_COLOR` feeds the browser theme-color meta (HEAD-022). Keep the
  assertion exact; a casing change alters the emitted metadata.

## Environment validation

### LIB-002 · Server environment defaults to development

- **Covers:** `env` (`server.ENVIRONMENT`) — `src/lib/env.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a Node test environment with `ENVIRONMENT` unset and the four client
  variables valid
- **When** the module is imported
- **Then** `env.ENVIRONMENT` is `"development"` and the import does not throw
- **Notes:** the default exists so local tooling does not need the variable. Do
  not inherit the developer's shell value; explicitly delete it for this case.

### LIB-003 · Invalid server environment values are rejected

- **Covers:** `env` (`server.ENVIRONMENT`) — `src/lib/env.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `ENVIRONMENT=staging`
- **When** the module is imported
- **Then** the import throws a validation error that names `ENVIRONMENT` and
  lists the allowed values (`development`, `production`, `test`)
- **Notes:** assert the variable name is in the message. A generic "invalid
  environment" would make deployment failures hard to diagnose.

### LIB-004 · Missing client variables fail fast

- **Covers:** `env` (`client`) — `src/lib/env.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a jsdom environment where `VITE_APP_NAME` is absent and the other
  three client variables are valid
- **When** the module is imported
- **Then** the import throws and the error identifies `VITE_APP_NAME` as missing
- **Notes:** repeat for each required variable, or use a table of cases inside one
  test. A missing site URL would otherwise produce `undefined` canonical URLs at
  runtime.

### LIB-005 · Malformed client URLs and emails are rejected

- **Covers:** `env` (`VITE_SITE_URL`, `VITE_SYSTEM_MAIL`,
  `VITE_SUPPORT_MAIL`) — `src/lib/env.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** valid values except one variable set to a malformed value (`not-a-url`
  for the site URL, `not-an-email` for either mail address)
- **When** the module is imported
- **Then** each import throws with the offending variable named
- **Notes:** the site URL is used for canonical and social URLs and the mail
  addresses for outbound links, so both formats matter.

### LIB-006 · Empty strings are treated as missing

- **Covers:** `emptyStringAsUndefined` — `src/lib/env.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `ENVIRONMENT=""` and `VITE_APP_NAME=""`
- **When** the module is imported
- **Then** `ENVIRONMENT` falls back to `"development"` and the empty app name is
  reported as missing rather than accepted
- **Notes:** an empty string in a deployment secret file is a common failure mode;
  silently accepting it produces blank titles.

### LIB-007 · The skip flag bypasses validation

- **Covers:** `skipValidation` — `src/lib/env.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `SKIP_ENV_VALIDATION=true` and every required variable missing or
  invalid
- **When** the module is imported
- **Then** the import succeeds and missing values may be `undefined` instead of
  raising a validation error
- **Notes:** the flag is an escape hatch for constrained build environments. It
  must not become the default, and this case should assert the flag is read as
  the literal string `"true"`, not any truthy value.

## Class-name helper

### LIB-008 · Class merging combines inputs and resolves conflicts

- **Covers:** `cn` — `src/lib/utils.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** conditional inputs containing falsy entries and two conflicting
  utility classes (for example two padding or background classes)
- **When** `cn` is called
- **Then** falsy entries are omitted, both conditional groups are included, and
  the later conflicting utility wins in the returned string
- **Notes:** this is a thin re-export of a third-party helper. Test the project
  contract only — the deduplication behavior UI components rely on — not every
  upstream feature. Do not snapshot the whole output string.
