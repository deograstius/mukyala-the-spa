# TODO: Component Reuse & Design System Refactor Plan

A pragmatic, phased checklist to improve reuse, reduce duplication, and standardize the design system without changing the current visual design.

## Goals

- [ ] Consolidate repeated patterns into shared components/primitives.
- [ ] Keep current look-and-feel; avoid visual regressions.
- [ ] Improve accessibility (focus, labels, live regions) via shared abstractions.
- [ ] Simplify data/price handling to avoid formatting/maths mix-ups.
- [ ] Maintain or improve existing test coverage.

---

## Milestone 1 — Shared Foundations

- [ ] Tokens/utilities audit
  - [x] Move repeated keyframes/overlays into `shared/styles/tokens.css`.
  - [x] Add aspect-ratio utilities (e.g. `.aspect-square`) to replace page-specific rules.
  - [x] Document token usage (spacing, radii, z-index) for new components.
- [ ] `Grid` primitive
  - [x] Create a responsive `Grid` component (columns, gaps, breakpoints) mirroring current class patterns.
  - [x] Replace direct `w-layout-grid grid-2-columns/grid-3-columns` where appropriate.
- [ ] `List`/`ListItem`
  - [x] Provide accessible list wrappers with consistent spacing; adopt where `role="list"` and `role="listitem"` are hand-rolled.
- [ ] `Price` display
  - [x] Add `Price` component to format cents consistently via existing `formatCurrency` util.
  - [x] Document usage: never store/compute with formatted strings.
- [ ] `slug` utilities
  - [x] Extract `getSlugFromHref` to `utils/slug.ts` (no feature coupling).
  - [x] Update imports across pages, hooks, and route loaders.

Acceptance: New primitives introduced; no visual change.

---

## Milestone 2 — Slide-Over Infrastructure

- [x] `SlideOver` component (built on `shared/a11y/Dialog`)
  - [x] Props: `side` (left/right), `width`, `panelClassName`, `ariaLabel/titleId`, animation variants.
  - [x] Encapsulate focus trap, Escape close, overlay click, and body scroll lock.
  - [x] Centralize keyframes (enter/exit) and remove inline `style` duplication.
- [x] Adopt in `MobileNav`
  - [x] Replace inline panel container + keyframes with `SlideOver`.
  - [x] Preserve existing markup for nav list; verify tab order.
- [x] Adopt in `CartDrawer`
  - [x] Swap panel container to `SlideOver` with right side and current width.
  - [x] Keep live region behavior; expose a `footer` slot if helpful.

Acceptance: Both mobile nav and cart drawer behave identically with improved code reuse; keyboard and screen reader flows verified.

---

## Milestone 3 — Card Unification (`MediaCard`)

- [x] Introduce `MediaCard`
  - [x] Props: `title`, optional `price`, `image` props, hooks for classes/slots.
  - [x] Reuse `ImageCardMedia`.
- [x] Migrate `ProductCard` to `MediaCard`
  - [x] Keep text/overlay placement and classes to preserve visuals.
  - [x] Update tests to the new component.
- [x] Migrate `ServiceCard` to `MediaCard`
  - [x] Preserve arrow icon treatment and overlay strength.
- [x] Remove duplication
  - [x] Delete the old components immediately after migration.

Acceptance: Product and service tiles share a single implementation; no visual diffs in grids.

---

## Milestone 4 — Detail Page Layout (`DetailLayout`)

- [x] Create `DetailLayout`
  - [x] Two-column responsive layout with image panel + content panel.
  - [x] Slots: `media`, `title`, `meta`, `description`, `actions`.
- [x] Shared `MetaRow`
  - [x] Small subcomponent to render price/duration rows consistently.
- [x] Adopt in `ProductDetail` and `ServiceDetail`
  - [x] Preserve headings, copy, and button placement.

Acceptance: Identical look; code duplication between detail pages removed.

---

## Milestone 5 — Hero & Section Consistency

- [x] `HeroSection` abstraction
  - [x] Props for background image, overlay, heading, CTA alignment (left/center), and radius.
  - [x] Supports “image-only” variant used in About.
- [x] Adopt in `Home/Hero`, Services/Shop headers, and About hero
  - [x] Replace page-specific overrides in `global.css` with componentized variants.
- [x] `SectionHeader` adoption
  - [x] Standardize left-title/right-actions across sections.

Acceptance: Hero sections implemented via `HeroSection`; CSS overrides reduced.

---

## Milestone 6 — Forms System

- [x] `FormField` base
  - [x] Handles `label`, `id`, `error`, `aria-invalid`, help text linking.
- [x] Field variants
  - [x] `InputField`, `SelectField`, `DateTimeField`, `PhoneInput` (format-on-input remains).
  - [x] Built-in error rendering and spacing; flexible `className` passthrough.
- [x] Live region helper
  - [x] Extract `LiveRegion` for status messaging (polite/atomic) used in cart and forms.
- [x] Refactor `Reservation` form
  - [x] Replace inline input markup with form fields; keep validation logic and timezone checks.

Acceptance: Reservation renders identically, with cleaner, reusable field components and consistent a11y attributes.

---

## Milestone 7 — Social & Overlay Cards

- [ ] `OverlayCardLink`
  - [ ] Generic “image + overlay + icon + text” card for social/community.
  - [ ] Props for icon, label, `href`, and hidden-on-mobile flag.
- [ ] Adopt in `Community`
  - [ ] Keep grid and CTA section intact; replace per-card markup with `OverlayCardLink`.

Acceptance: Community grid unchanged visually with reusable link card.

---

## Milestone 8 — CSS Consolidation

- [ ] Move slide-in keyframes to a shared CSS and reference from `SlideOver`.
- [ ] Replace page-level aspect rules with utilities (e.g., `.aspect-square`).
- [ ] Encapsulate About-hero specific overrides into `HeroSection` variant or utility class.
- [ ] Remove redundant global tweaks after component adoption.

Acceptance: `global.css` simplified; tokens/utilities cover prior bespoke rules.

---

## Milestone 9 — Data & Price Normalization

- [ ] Standardize product/service `priceCents` (number)
  - [ ] Replace `price` string fields with `priceCents` number across data.
  - [ ] Update all renderers to use `Price`; cart math numeric end-to-end.
  - [ ] Remove any dependencies on formatted price strings.
- [ ] Slug util adoption
  - [ ] Replace all imports of `getSlugFromHref` to `utils/slug`.
  - [ ] Update tests that reference old hook locations.

Acceptance: Currency formatting consistent; data model avoids mixing strings with math; loaders unchanged.

---

## Milestone 10 — Tests & QA

- [ ] Unit tests
  - [ ] `SlideOver` a11y (focus trap, escape key, overlay click).
  - [ ] `MediaCard` renders title/price and links correctly.
  - [ ] `FormField` propagates aria props and errors.
- [ ] Interaction tests
  - [ ] MobileNav open/close/tab order.
  - [ ] CartDrawer quantity updates and live region messages.
- [ ] Visual spot checks
  - [ ] Compare key pages before/after (Home, Services, Shop, Product/Service detail, Reservation) at mobile/tablet/desktop widths.
  - [ ] Cross-browser sanity (Chromium/WebKit/Firefox).

Acceptance: All existing tests pass; new tests cover abstractions; no regressions in e2e flows.

---

## Milestone 11 — Docs & Cleanup

- [ ] Developer docs
  - [ ] Short README for shared components (props, examples, do/don’t).
  - [ ] Note on design tokens and when to add utilities vs. inline styles.
- [ ] Cleanup
  - [ ] Remove old components/styles and unused CSS overrides.
  - [ ] Purge dead imports/usages; run linter.

Acceptance: Clear guidance for future contributions; no stray components/styles.

---

## Sequencing Summary

1. Foundations (tokens/utilities, Grid/List, Price, slug utils)
2. SlideOver, adopt in MobileNav + CartDrawer
3. MediaCard, migrate Product/Service cards
4. DetailLayout for Product/Service detail pages
5. HeroSection and SectionHeader consistency
6. Forms system and Reservation refactor
7. Overlay cards for Community
8. CSS consolidation and cleanup
9. Data normalization for prices and slug util adoption
10. Tests, docs, and final cleanup

---
