# UI Primitives — Test Implementation

Scope: `src/components/ui/**` — currently the `Button` primitive and its exported
variant helper. Components must render accessible, native-feeling controls, merge
caller classes predictably, and expose every documented variant and size. Visual
polish belongs to `styles.md`; these cases assert structure, semantics, and
interaction.

## Source map

| File                           | Responsibility                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `src/components/ui/button.tsx` | Button primitive wrapping Base UI: variant/size styles, slot marker, prop forwarding |

## Coverage summary

| Status      | Count |
| ----------- | ----- |
| Implemented | 1     |
| Partial     | 0     |
| Missing     | 7     |
| **Total**   | **8** |

Existing test files:

- `src/components/ui/button.test.tsx` — renders a button with text and asserts it
  is reachable by the accessible role and name. This covers UI-001 only. It does
  not assert variants, sizes, class merging, interaction, disabled state, or prop
  forwarding.

No verification command was run for this file individually; `pnpm test` was run
for the repository on 2026-10-21 and reported 4 files / 12 tests passing.

## Test environment

- **Component:** Testing Library under jsdom with the shared setup file, which
  registers jest-dom matchers and unmounts trees after each test. Use
  `user-event` for interaction instead of firing raw events.
- **Class assertions:** assert individual Tailwind tokens or the presence of a
  variant-specific class with `toHaveClass`. Do not assert the entire class string
  or snapshot it; utility ordering changes frequently and the Prettier Tailwind
  plugin may rewrite it.
- **Base UI behavior:** the primitive wraps `@base-ui/react/button`. Verify the
  installed version's composition API (the `render` prop) before writing UI-008;
  do not assume Radix's `asChild` semantics.
- **Auth/permissions:** not applicable at this layer. Permission-gated actions
  belong to the consuming feature, not the primitive.
- **Determinism:** no time, IDs, or network in these cases.
- **Money:** not applicable.

## Rendering and semantics

### UI-001 · A button renders its children with an accessible name

- **Covers:** `Button` — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Implemented
- **Given** a button with the text `Click me`
- **When** it renders
- **Then** the element is reachable by the `button` role and the accessible name
  `Click me`
- **Notes:** implemented by `src/components/ui/button.test.tsx`. This is the
  baseline contract; all other cases build on it.

### UI-002 · The default render exposes the slot marker and default styles

- **Covers:** `Button` — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a button rendered with no variant or size props
- **When** it renders
- **Then** the element has `data-slot="button"`, the primary background token
  class, and the default height token class for the default size
- **Notes:** the slot marker is used by styling and testing hooks; the default
  variant and size must match `cva` defaults. Assert tokens, not full strings.

### UI-003 · Every documented variant applies its own styling

- **Covers:** `buttonVariants` (`variant`) — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** six buttons, one for each variant: `default`, `outline`, `secondary`,
  `ghost`, `destructive`, and `link`
- **When** they render
- **Then** each has the class token that distinguishes its variant (for example
  the primary background for `default`, a border for `outline`, an underline
  offset for `link`), and no button receives another variant's distinguishing
  token
- **Notes:** use a table-driven test; one case per variant would add noise. The
  `destructive` variant uses a tinted background and destructive text, not a
  solid red background; assert what the component actually contracts.

### UI-004 · Every documented size applies its own dimensions

- **Covers:** `buttonVariants` (`size`) — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** buttons for `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`,
  `icon-sm`, and `icon-lg`
- **When** they render
- **Then** each has the height or square-size token for its size, and icon sizes
  produce square controls with no horizontal padding
- **Notes:** the `icon*` sizes are square; a regression here breaks toolbar layout.

### UI-005 · Caller classes are merged without dropping variant classes

- **Covers:** `Button` (`className` prop) — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a `ghost` button with `className="custom-marker"` and, separately, a
  caller class that conflicts with a variant utility
- **When** it renders
- **Then** `custom-marker` is present and the conflicting caller utility wins,
  while unrelated variant utilities remain
- **Notes:** proves `cn` is used rather than string concatenation. Do not assert
  the order of unrelated classes.

## Interaction and state

### UI-006 · Activation runs the handler for click and keyboard

- **Covers:** `Button` (`onClick`) — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P1 · **Status:** Missing
- **Given** a rendered button with a spy handler
- **When** the user clicks it, then focuses it and presses Enter, then presses
  Space
- **Then** the handler is called once per activation (three calls total)
- **Notes:** native button semantics should already provide keyboard activation;
  this case ensures the wrapper does not swallow key events. Do not assert event
  object internals.

### UI-007 · A disabled button cannot be activated and reports its state

- **Covers:** `Button` (`disabled` prop) — `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P0 · **Status:** Missing
- **Given** a button rendered with `disabled`
- **When** the user attempts a click and keyboard activation
- **Then** the element exposes the disabled state to assistive technology, the
  handler is never called, and the disabled styling hook remains present
- **Notes:** a visually dimmed but clickable button is a production-safety issue
  for submit and delete actions. Assert the semantic disabled state, not only the
  opacity class.

### UI-008 · Native and composition props are forwarded

- **Covers:** `Button` (prop passthrough, `render` prop, `ButtonProps`) —
  `src/components/ui/button.tsx`
- **Type:** component · **Priority:** P2 · **Status:** Missing
- **Given** a button with `type="submit"`, `name`, `value`, `aria-label`, and a
  `render` prop that composes the control as an anchor with an `href`
- **When** it renders and is activated
- **Then** the native attributes appear on the resulting element, the composed
  element is reachable by the expected role, and navigation intent is preserved
- **Notes:** confirm the Base UI version's composition API before implementing.
  If `render` is unsupported, split this into attribute forwarding (always
  required) and composition (only if supported), and record the decision here.
