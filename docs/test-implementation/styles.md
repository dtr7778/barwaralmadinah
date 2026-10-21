# Design Tokens and Styles — Test Implementation

Scope: `src/styles.css` — the single stylesheet that imports Tailwind, the
animation and shadcn layers, typography, and fonts, then defines the semantic color
tokens, chart and sidebar palettes, radius scale, and base-layer rules. These are
visual contracts. They cannot be meaningfully asserted in jsdom, where Tailwind is
not compiled; cases are written for browser-level or build-output verification.

## Source map

| File             | Responsibility                                                                      |
| ---------------- | ----------------------------------------------------------------------------------- |
| `src/styles.css` | Tailwind imports, design tokens, theme mapping, radius scale, and base-layer resets |

## Coverage summary

| Status      | Count |
| ----------- | ----- |
| Implemented | 0     |
| Partial     | 0     |
| Missing     | 5     |
| **Total**   | **5** |

Existing test files: none. The Vitest config does not run the Tailwind plugin, so
importing this stylesheet in a unit test does not produce compiled utilities.

## Test environment

- **Unit:** not suitable for utility generation. A test may read the raw file and
  assert that a token declaration exists, but that proves syntax, not rendering.
- **Build / e2e:** compile the app with `vite build` and inspect the emitted CSS
  for the token values and generated utilities, or use a browser (Playwright) to
  assert computed styles on a rendered element. Prefer computed styles for the
  base layer and logical-property behavior.
- **Required fixtures:** a rendered page with a primary button, a card, and a
  right-to-left document (`dir="rtl"`). Force the light scheme explicitly; the
  environment may report dark.
- **Auth/permissions:** not applicable.
- **Determinism:** no time or randomness. Font loading must not be required for
  color/layout assertions; wait for stylesheets, not fonts, unless the case is
  about typography.
- **Money:** not applicable.

## Tokens and theme

### STYLE-001 · The light theme defines the full semantic token set

- **Covers:** `:root` custom properties — `src/styles.css`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** the compiled stylesheet or a rendered page with no color-scheme
  override
- **When** the root custom properties are read
- **Then** the semantic tokens `--background`, `--foreground`, `--card`,
  `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`,
  `--border`, `--input`, `--ring`, `--success`, and `--warning` are all defined,
  together with five chart tokens and the sidebar token family
- **Notes:** a missing token makes `bg-primary`-style utilities silently
  transparent. Assert presence and non-empty values, not exact OKLCH strings,
  unless the palette is a brand requirement.

### STYLE-002 · Theme tokens generate the expected utilities

- **Covers:** `@theme inline` — `src/styles.css`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a page with elements using `bg-background`, `text-foreground`,
  `bg-primary`, `text-destructive`, and `border-border`
- **When** computed styles are read under the light scheme
- **Then** each utility resolves to the corresponding custom property value, not
  to an initial/transparent value, and `bg-background` differs from
  `bg-primary`
- **Notes:** proves the mapping block, not just the variable declarations.

### STYLE-003 · The base layer applies global color, font, and cursor rules

- **Covers:** `@layer base` — `src/styles.css`
- **Type:** e2e · **Priority:** P1 · **Status:** Missing
- **Given** a rendered page with a body, an enabled button, a disabled button, and
  a `role="button"` element
- **When** computed styles are read
- **Then** the body uses the background and foreground tokens, the document uses
  the sans font, enabled buttons and button-role elements show a pointer cursor,
  and disabled buttons do not
- **Notes:** the cursor rule prevents "clickable but no affordance" controls. A
  `[role="button"]` without the native tag must still get the cursor.

### STYLE-004 · The radius scale derives from the base radius token

- **Covers:** radius tokens in `@theme inline` — `src/styles.css`
- **Type:** e2e · **Priority:** P2 · **Status:** Missing
- **Given** `--radius` is `0.625rem`
- **When** elements using `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`,
  and `rounded-4xl` are measured
- **Then** the computed corner radii follow the documented multipliers
  (0.6×, 0.8×, 1×, 1.4×, 2.6× of the base) within a sub-pixel tolerance
- **Notes:** use a tolerance for sub-pixel border radii; exact string comparison of
  computed lengths is brittle across browsers.

### STYLE-005 · Dark-mode components have a defined token source

- **Covers:** dark variants — `src/styles.css`
- **Type:** e2e · **Priority:** P2 · **Status:** Missing
- **Given** a page rendered with a dark color scheme, containing the button
  primitive whose classes include `dark:` variants
- **When** computed styles are read
- **Then** either a dark token block provides the overridden values, or the
  components deliberately retain the light palette; the behavior is documented and
  no element becomes unreadable
- **Notes:** the stylesheet currently defines no dark token block, while the button
  uses `dark:` utilities. Ambiguity for the owner: is dark mode unsupported at this
  stage, or are the dark classes waiting for tokens? Resolve before shipping a
  theme toggle, and update this case with the decision.
