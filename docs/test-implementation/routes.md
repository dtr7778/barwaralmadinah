# Routing and App Shell — Test Implementation

Scope: `src/router.tsx`, `src/routes/**` — router construction, the root document
shell, locale derivation for every request, the optional-locale route guard, and
the demo index page. There are no authenticated or permission-guarded routes at
this baseline; when they are added they belong here until a dedicated domain
document owns them. The locale segment is optional, unprefixed paths are Arabic,
and an unsupported segment must produce a 404 rather than a silent redirect.

## Source map

| File                              | Responsibility                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/router.tsx`                  | Creates the TanStack Router instance with scroll restoration and preload defaults                       |
| `src/routes/__root.tsx`           | Resolves locale and catalogs in `beforeLoad`, renders `<html lang/dir>`, wires global head and provider |
| `src/routes/{-$locale}/route.tsx` | Optional locale layout, rejects unsupported locale prefixes with `notFound`, renders localized 404      |
| `src/routes/{-$locale}/index.tsx` | Demo index page: localized head metadata and translated content with a frozen demo date                 |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 14     |
| **Total**   | **14** |

Existing test files: none. No test currently mounts the router or imports a route
module.

## Test environment

- **Unit:** route modules export a `Route` object. Prefer asserting route options
  (guard outcomes, head output) through the router rather than reaching into
  private component internals.
- **Component / integration:** build a memory-history router from the real
  `routeTree` and render `RouterProvider`. Use `createMemoryHistory({ initialEntries: ["/en"] })`
  for deterministic navigation. Await the router's load before asserting.
- **Required mocks:** `src/lib/head/index.ts` reads `env` at call time, so the
  four client variables (`VITE_APP_NAME`, `VITE_SITE_URL`, `VITE_SYSTEM_MAIL`,
  `VITE_SUPPORT_MAIL`) must be present in the test runtime. Set them before the
  env module is first imported, or use the documented skip-validation flag in a
  dedicated setup; do not scatter ad-hoc env stubs across cases.
- **Server function:** the root route awaits `loadMessages`. Mock it at the module
  boundary with a deterministic catalog map, and separately keep I18N-016..018 as
  the real server-function contract tests. Do not mock `getMessages` as well;
  one boundary is enough.
- **Auth/permissions:** none at this commit. Record here when `requireSessions` or
  `requirePermissions` guards are added to routes.
- **Determinism:** the index page's date is a module constant
  (`2026-01-01T00:00:00Z`); do not replace it with the current clock. Assert the
  formatted date with the same `Intl` options and time zone the provider uses.
- **Money:** not applicable.

## Router construction

### RTE-001 · Router uses the configured scroll and preload behavior

- **Covers:** `getRouter` — `src/router.tsx`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the application router factory
- **When** a router is created
- **Then** it reports scroll restoration enabled, intent-based preloading, and a
  preload stale time of `0`, and it is built from the generated route tree
- **Notes:** assert through public router options (`router.options` or the
  documented accessor), not by mocking the router factory.

## Root context and locale

### RTE-002 · The first path segment selects the locale

- **Covers:** `beforeLoad` — `src/routes/__root.tsx`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** paths `/`, `/ar`, `/ar/products`, `/en`, and `/en/products`
- **When** the root `beforeLoad` runs
- **Then** the resolved locale is `ar` for the first three (including the
  unprefixed root) and `en` for the last two
- **Notes:** derive from the first segment only; a segment deeper in the path must
  never change the locale. Query strings are not part of `location.pathname`.

### RTE-003 · Root context exposes the catalog for the resolved locale

- **Covers:** `beforeLoad` — `src/routes/__root.tsx`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** `loadMessages` is stubbed to return a recognizable catalog per locale
- **When** the root route loads for `/en`
- **Then** route context contains `locale: "en"` and exactly the English catalog
  object, and `loadMessages` received `en` as its validated data
- **Notes:** verifies the call shape (`{ data: locale }`), not internal call
  counts. A wrong call shape is a runtime crash in production.

### RTE-004 · The root head reflects the resolved locale

- **Covers:** `head` — `src/routes/__root.tsx`, `globalHead` —
  `src/lib/head/index.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the root route loads for `/en`
- **When** its head is produced
- **Then** the title is the English app name, the description is the English
  meta description, `og:locale` is `en_US`, and the manifest link points to
  `/site.en.webmanifest`
- **Notes:** repeat for `/` (Arabic). Detailed metadata construction is owned by
  `head.md`; this case only proves the route passes the right locale through.

### RTE-005 · The document shell sets language and direction

- **Covers:** `createRootRouteWithContext` / `RootDocument` —
  `src/routes/__root.tsx`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** the router at `/ar`
- **When** the root shell renders
- **Then** the `<html>` element has `lang="ar"` and `dir="rtl"`, and at `/en` it
  has `lang="en"` and `dir="ltr"`
- **Notes:** this is the accessibility and layout contract for the whole app.
  Assert both values together so a locale/direction mismatch cannot pass.

### RTE-006 · Descendants receive translations from the root provider

- **Covers:** `RootDocument` — `src/routes/__root.tsx`,
  `I18nProvider` — `src/i18n/i18n-provider.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the real route tree and a stubbed catalog with a known English and
  Arabic `demo.title`
- **When** the index page renders at `/` and at `/en`
- **Then** the visible heading is the Arabic title at `/` and the English title
  at `/en`
- **Notes:** proves the provider is inside the shell and receives route context,
  rather than creating a second, disconnected provider.

## Locale guard and 404

### RTE-007 · An unsupported locale prefix produces a 404

- **Covers:** `beforeLoad` — `src/routes/{-$locale}/route.tsx`
- **Type:** integration · **Priority:** P0 · **Status:** Missing
- **Given** requests for `/fr` and `/fr/products`
- **When** the router resolves the route
- **Then** a not-found result is rendered and the index page content is absent
- **Notes:** the root `beforeLoad` resolves these paths to the default locale
  first, so the rendered 404 is expected to be Arabic (`lang="ar"`, `dir="rtl"`).
  Record that combined behavior explicitly.

### RTE-008 · Supported and locale-less paths are not rejected

- **Covers:** `beforeLoad` — `src/routes/{-$locale}/route.tsx`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** requests for `/`, `/ar`, `/ar/`, `/en`, and `/en/`
- **When** the locale guard runs
- **Then** none of them produces a not-found result; the index page renders
- **Notes:** `/` passes because `params.locale` is absent. This case protects the
  guard from becoming "require a locale" during refactors.

### RTE-009 · The 404 screen is translated

- **Covers:** `NotFound` — `src/routes/{-$locale}/route.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the locale layout renders its not-found component under an Arabic
  catalog
- **When** the 404 screen appears
- **Then** it shows the `notFound.title` and `notFound.description` strings
  (`404` and `تعذّر العثور على الصفحة المطلوبة.`) inside a `main` landmark
- **Notes:** assert both strings; asserting only `404` would pass even if the
  description were missing.

### RTE-010 · Unknown nested paths under a valid locale are handled as 404

- **Covers:** root and locale layout — `src/routes/__root.tsx`,
  `src/routes/{-$locale}/route.tsx`
- **Type:** integration · **Priority:** P2 · **Status:** Missing
- **Given** a request for `/en/does-not-exist`
- **When** the router resolves it
- **Then** a not-found screen is rendered, still inside the English document shell
  (`lang="en"`, `dir="ltr"`)
- **Notes:** the root route defines no `notFoundComponent`; only the locale
  layout does. It is unclear whether an unmatched child under `/en` uses that
  component or the router default. Resolve the ambiguity with a test, then record
  the chosen behavior here.

## Index page

### RTE-011 · Index head uses the page title and template

- **Covers:** `head` — `src/routes/{-$locale}/index.tsx`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** the configured app name `Jorna`
- **When** the index page loads at `/en`
- **Then** the title is `use-intl is working | Jorna` and the description is the
  English demo description
- **Notes:** this proves the route uses `titleByTemplate`, not a literal title.
  Cover Arabic separately only if the Arabic demo title differs; it does at this
  commit.

### RTE-012 · Index head canonical and alternate links follow the locale

- **Covers:** `head` — `src/routes/{-$locale}/index.tsx`,
  `buildHead` — `src/lib/head/buildHead.ts`
- **Type:** integration · **Priority:** P1 · **Status:** Missing
- **Given** a site URL of `https://example.test`
- **When** the index page loads at `/` and at `/en`
- **Then** the Arabic canonical is `https://example.test`, the English canonical
  is `https://example.test/en`, and both emit alternates for `en`, `ar`, and
  `x-default`
- **Notes:** the exact link-building rules and their edge cases are owned by
  `head.md` (HEAD-006..011); this case proves the route supplies the right
  pathname.

### RTE-013 · Index content is translated and greets the right name

- **Covers:** `RouteContent` — `src/routes/{-$locale}/index.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** the index page at `/` and at `/en`
- **When** it renders
- **Then** the Arabic page greets `سارة`, the English page greets `Sara`, and the
  heading and description match the active catalog
- **Notes:** this is the only place the locale-dependent demo name is chosen.
  Do not assert catalog copy in `routes.md` beyond the strings needed to prove
  the selection.

### RTE-014 · Index content renders plural items and the frozen demo date

- **Covers:** `RouteContent`, `DEMO_DATE` — `src/routes/{-$locale}/index.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** the frozen demo instant `2026-01-01T00:00:00Z`
- **When** the index page renders in each locale
- **Then** the items line uses the count `3` and the plural form for three, and
  the date line shows the medium-format date for that instant in `Asia/Riyadh`
- **Notes:** the date text depends on ICU and the Node build. Compare against an
  `Intl.DateTimeFormat` call with identical locale, style, and time zone instead
  of hard-coding a string. The date is a constant in the component, so this case
  never uses "today".
