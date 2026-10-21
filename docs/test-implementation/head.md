# Head Metadata — Test Implementation

Scope: `src/lib/head/**` — construction of `<meta>` and `<link>` descriptors for
titles, social previews, canonical URLs, language alternates, favicons, web
manifests, and the environment-driven factory used by routes. Output is plain
data consumed by TanStack Router's head pipeline; behavior is about which entries
exist and what they contain, not about React rendering.

## Source map

| File                          | Responsibility                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `src/lib/head/buildHead.ts`   | Core builder: title resolution, canonicalization, robots, social toggles, link ordering |
| `src/lib/head/og.ts`          | Open Graph and Twitter card entries, locale and alternate-locale selection              |
| `src/lib/head/favicon.ts`     | The fixed favicon link set                                                              |
| `src/lib/head/webmanifest.ts` | Locale-specific web manifest link                                                       |
| `src/lib/head/index.ts`       | Reads env and translations, then configures the core builder for app routes             |

## Coverage summary

| Status      | Count  |
| ----------- | ------ |
| Implemented | 0      |
| Partial     | 0      |
| Missing     | 23     |
| **Total**   | **23** |

Existing test files: none. No test currently imports `src/lib/head/**`.

## Test environment

- **Unit:** all builders are pure functions over plain inputs. Use fixed strings
  such as `https://example.test`, `Jorna`, and a fixed theme color. Assert the
  returned arrays with containment checks on entry objects; asserting the whole
  array is acceptable when order is part of the contract (HEAD-021).
- **Env factory:** `src/lib/head/index.ts` reads `env` at call time and imports
  the compiled stylesheet URL. Set `VITE_APP_NAME`, `VITE_SITE_URL`,
  `VITE_SYSTEM_MAIL`, and `VITE_SUPPORT_MAIL` before the module is first
  imported, then reset modules between cases that need different env values.
  Mock the CSS import only if the test runner cannot resolve `?url`.
- **Auth/permissions:** not applicable.
- **Determinism:** no clock or random input. URLs are fixed fixtures. If a case
  asserts a generated stylesheet path, assert a stable property (it is a non-empty
  string ending in `.css`), not the build hash.
- **Money:** not applicable.

## Titles and descriptions

### HEAD-001 · A title template without `%s` is rejected

- **Covers:** `buildHead` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** a configuration whose `titleTemplate` is `"Jorna"` (no placeholder)
- **When** `buildHead` is called
- **Then** it throws an error whose message is exactly
  `buildHead: titleTemplate must contain "%s"` and returns no partial result
- **Notes:** a silent fallback would ship every page with the same title.

### HEAD-002 · A literal page title is used verbatim

- **Covers:** `head` (`title` option) — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a configuration with `titleTemplate: "%s | Jorna"`
- **When** a page requests `title: "Inventory"`
- **Then** the `title` meta entry content is exactly `Inventory`, with no template
  applied
- **Notes:** this is the escape hatch for fully composed titles.

### HEAD-003 · A template title substitutes the page name

- **Covers:** `head` (`titleByTemplate` option) — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `titleTemplate: "%s | Jorna"`
- **When** a page requests `titleByTemplate: "Inventory"`
- **Then** the `title` meta entry content is exactly `Inventory | Jorna`
- **Notes:** the template is applied once, not repeatedly.

### HEAD-004 · Substitution does not interpret `$` patterns in the page title

- **Covers:** `head` (`titleByTemplate` option) — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `titleTemplate: "%s | Jorna"`
- **When** the page title is `"Costs $& more"` or `"100$"`
- **Then** the result contains those characters literally and does not inject the
  matched `%s` text or truncate at `$`
- **Notes:** uses a replacer function rather than string replacement; this case
  locks that behavior in. Catalog-driven titles can contain currency symbols.

### HEAD-005 · Page description overrides the site description

- **Covers:** `head` (`description` option) — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a site description of `Default description`
- **When** one page omits `description` and another supplies `Page description`
- **Then** the first page uses the site description and the second uses the page
  description
- **Notes:** applies to both the base description meta and the social description;
  assert both.

## Canonical URLs

### HEAD-006 · The default locale's root canonical has no path and no trailing slash

- **Covers:** `head` / `canonicalUrl` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `siteUrl: "https://example.test/"` and the default locale `ar`
- **When** the canonical for pathname `/` is built
- **Then** the `canonical` link href is exactly `https://example.test`
- **Notes:** the trailing slash on the configured site URL is removed once. This
  is the canonical form search engines see for the home page.

### HEAD-007 · Default-locale pages are not locale-prefixed

- **Covers:** `head` / `canonicalUrl` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** the default locale `ar`
- **When** canonicals are built for `/products` and `/products/`
- **Then** the first is `https://example.test/products`; the second keeps the
  trailing slash (`https://example.test/products/`)
- **Notes:** trailing slashes are not normalized. Record the observed behavior and
  the open question in the final report: should `/products/` canonicalize to
  `/products`? Do not change the implementation here.

### HEAD-008 · English pages are prefixed with the locale

- **Covers:** `head` / `localizePathname` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** locale `en`
- **When** canonicals are built for `/` and `/products`
- **Then** the hrefs are `https://example.test/en` and
  `https://example.test/en/products`
- **Notes:** the root gets `/en` with no trailing slash.

### HEAD-009 · An already-prefixed English path is not prefixed twice

- **Covers:** `head` / `stripLocalePrefix` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** locale `en`
- **When** the canonical is built for `/en/products`
- **Then** the href is `https://example.test/en/products`, not
  `https://example.test/en/en/products`
- **Notes:** routes pass `match.pathname`, which already contains the prefix, so
  this path is the normal one, not an edge case.

### HEAD-010 · An explicit default-locale prefix is preserved

- **Covers:** `head` / `stripLocalePrefix` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** locale `ar`
- **When** the canonical is built for `/ar/products`
- **Then** the href is `https://example.test/ar/products`
- **Notes:** only non-default prefixes are stripped, so an explicit `/ar` prefix
  survives. Ambiguity to resolve: is `/ar/products` supposed to canonicalize to
  `/products`? If yes, this case must be updated with the fix, not silently
  deleted. Ask the owner before changing behavior.

### HEAD-011 · Pathnames are normalized to a leading slash

- **Covers:** `head` / `normalizePathname`, `stripLocalePrefix` —
  `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** pathname `products`
- **When** the canonical is built for the default locale
- **Then** the href is `https://example.test/products`
- **Notes:** a leading slash is required by route consumers. The counterpart
  behavior for trailing slashes is documented in HEAD-007.

### HEAD-012 · Language alternates exist for every locale plus a default

- **Covers:** `head` / `buildAlternateLinks` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** locale order `["en", "ar"]`, pathname `/products`, and an English page
- **When** head links are built
- **Then** there are exactly three `alternate` links, in order: `en` →
  `https://example.test/en/products`, `ar` →
  `https://example.test/products`, and `x-default` →
  `https://example.test/products`
- **Notes:** `x-default` intentionally duplicates the default locale URL but is a
  separate entry. Order follows the locale list; changing the list is a breaking
  metadata change.

### HEAD-013 · Global head has no canonical or alternate links

- **Covers:** `globalHead` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** a global head request for each locale
- **When** links are produced
- **Then** there is no `canonical` link and no `alternate` link; stylesheets,
  favicons, and the manifest are still present
- **Notes:** global head is used before a specific page pathname is known, so
  claiming a canonical would be wrong.

## Robots and social metadata

### HEAD-014 · Default robots and googlebot directives are applied

- **Covers:** `buildHead` / `buildMeta` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** a configuration with no `robots` override
- **When** base meta is built
- **Then** `robots` is `index, follow` and `googlebot` is the extended
  `index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1`
- **Notes:** the googlebot value is a constant; exact string matters to crawlers.

### HEAD-015 · A noindex policy is mirrored to googlebot

- **Covers:** `buildHead` / `buildMeta` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P0 · **Status:** Missing
- **Given** `robots: "noindex, nofollow"`
- **When** meta is built
- **Then** the `googlebot` entry is also `noindex, nofollow`, not the permissive
  default
- **Notes:** a page intended to be excluded from search must not invite Google to
  index it. Test a string that contains `noindex` in a larger directive list.

### HEAD-016 · Disabling social metadata removes Open Graph and Twitter tags

- **Covers:** `buildHead` / `buildMeta` (`social` option) —
  `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `social: false`
- **When** meta is built
- **Then** no entry name or property starts with `og:` or `twitter:`, while the
  base title, description, viewport, and robots entries remain
- **Notes:** useful for private or internal pages. Pair with HEAD-017 to prove
  the default is still social-enabled.

### HEAD-017 · Open Graph locale names the page language and its alternative

- **Covers:** `buildOgMeta` — `src/lib/head/og.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** social metadata for an Arabic page and an English page
- **When** OG entries are built
- **Then** the Arabic page has `og:locale: ar_SA` and exactly one
  `og:locale:alternate: en_US`; the English page has `en_US` with one
  `ar_SA` alternate
- **Notes:** no self-referential alternate and no duplicates. The mapping itself
  is covered by I18N-006.

### HEAD-018 · Social image URLs are absolute and configurable

- **Covers:** `buildHead` (`ogImagePath`), `buildOgMeta` —
  `src/lib/head/buildHead.ts`, `src/lib/head/og.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** `siteUrl: "https://example.test"` with no custom image path, then
  with `ogImagePath: "/social/card.png"`
- **When** social metadata is built
- **Then** the default `og:image` and `twitter:image` are
  `https://example.test/opengraph-image.jpeg`; the override is
  `https://example.test/social/card.png`; width `1200`, height `630`, and
  `og:image:alt` equals the app name in both cases
- **Notes:** relative image URLs are ignored by most crawlers, so absolute output
  is the contract.

## Favicons, manifest, and ordering

### HEAD-019 · The favicon link set is complete

- **Covers:** `buildFaviconLinks` — `src/lib/head/favicon.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** any head request
- **When** favicon links are built
- **Then** exactly four entries are returned: a 96×96 PNG icon, an SVG icon, a
  `shortcut icon` pointing at `/favicon.ico`, and a 180×180 Apple touch icon
- **Notes:** assert rel, type, sizes, and href for each. Missing apple icons cause
  a request storm on iOS.

### HEAD-020 · The web manifest link matches the locale

- **Covers:** `buildWebmanifest` — `src/lib/head/webmanifest.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** the locales `ar` and `en`
- **When** manifest links are built
- **Then** Arabic points at `/site.webmanifest` and English at
  `/site.en.webmanifest`
- **Notes:** the English file name is easy to typo; assert it exactly.

### HEAD-021 · Link order is stable and canonical comes last

- **Covers:** `head` / `buildLinks` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P2 · **Status:** Missing
- **Given** two stylesheets and a page pathname
- **When** head links are built
- **Then** the stylesheets appear first in the given order, followed by the four
  favicon links, then the manifest, then the canonical link, then the alternates
- **Notes:** order is not semantic to browsers but is part of the generated output
  contract and useful for snapshot diffs. Do not assert a full HTML document.

### HEAD-022 · Global metadata contains the app-shell essentials

- **Covers:** `globalHead` / `buildMeta` — `src/lib/head/buildHead.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** an app name `Jorna`, theme color `#5E381D`, and the Arabic locale
- **When** global meta is built
- **Then** it contains UTF-8 charset, the responsive viewport, the theme color,
  the default title, the site description, robots and googlebot directives,
  `telephone=no`, mobile web-app capable `yes`, the Apple app title `Jorna`, and
  the status bar style `black-translucent`
- **Notes:** the Apple title is the app name, not the page title. This is the
  metadata every page inherits.

### HEAD-023 · The configured factory localizes titles and descriptions

- **Covers:** `createHead`, `globalHead`, `head` — `src/lib/head/index.ts`
- **Type:** unit · **Priority:** P1 · **Status:** Missing
- **Given** `VITE_APP_NAME=Jorna`, `VITE_SITE_URL=https://example.test`, and the
  real Arabic and English catalogs
- **When** `globalHead("ar")` and `head("en", { pathname: "/", titleByTemplate: "Demo" })`
  are called
- **Then** the Arabic default title is `Jorna`, the Arabic description is the
  catalog description, the English page title is `Demo | Jorna`, and the app
  stylesheet link is present in both results
- **Notes:** proves translation wiring, not copy. Changing catalog wording should
  not require changing this case if assertions use the catalog values.
