# Component Architecture Refactor – TODO

Purpose: Gradually improve code organization, reusability, and accessibility without changing behavior. This plan is incremental and safe to execute over multiple PRs.

## Outcomes

- Clear separation between primitives, features, pages, and entities.
- Shared overlay/dialog primitive (focus trap, a11y) used by mobile nav and cart.
- Router-driven data and page metadata; fewer direct `document` manipulations.
- Less global CSS; tighter component boundaries; easier testing.

---

## Phase 1 — Boundaries & Aliases

- [ ] Create folders (no behavior changes yet):
  - [ ] `src/app/` (providers, router, seo helpers)
  - [ ] `src/shared/` (ui, a11y, hooks, lib, styles)
  - [ ] `src/entities/` (product, service, cart)
  - [ ] `src/features/` (cart-drawer, shop, services, home)
- [x] Add TS/Vite path aliases:
  - [ ] `@app/*`, `@shared/*`, `@features/*`, `@entities/*`, `@pages/*`, `@data/*`, `@utils/*`
- [ ] Move files into new folders while preserving imports (update paths only).
- [ ] CI sanity check: typecheck, tests, build green.

## Phase 2 — Primitives: Dialog/Overlay/Focus

- [x] Add `@shared/a11y/Dialog` primitive with:
  - [ ] `role="dialog"`, labelled by heading id, `aria-modal="true"`
  - [x] Initial focus + focus trap + restore focus to opener
  - [x] Escape to close, click-outside detection
  - [x] Slot for content and header/footer affordances
- [x] Refactor `MobileNav` to use `Dialog` primitive
- [x] Refactor `CartDrawer` to use `Dialog` primitive
- [x] Tests updated for both to assert a11y and focus behavior (existing tests still green)

## Phase 3 — Routing, Data, and SEO

- [ ] ProductDetail:
  - [ ] Use TanStack Router params instead of parsing `window.location`
  - [ ] Move product lookup into route `loader`; 404 on not found
  - [ ] Update tests to use router context as needed
- [ ] SEO:
  - [ ] Add `@app/seo.ts` with `setTitle` or route meta helpers
  - [ ] Replace inline `document.title` with router/meta usage where feasible
- [ ] Preloading: validate `defaultPreload: 'intent'` and enable for product links

## Phase 4 — Styles & Tokens

- [ ] Add `src/shared/styles/tokens.css` for color/spacing/typography variables
- [ ] Reduce new rules in `src/styles/global.css`; co-locate small overrides in feature wrappers when safe
- [ ] Create small utility classes (e.g., `.flex-row-gap`, `.sr-only`) to replace repeated inline styles
- [ ] (Optional) Introduce CSS Modules for new components; leave legacy Webflow CSS isolated

## Phase 5 — Performance & Assets

- [ ] Code-splitting: lazy-load feature-heavy pages (`Shop`, `ProductDetail`)
- [ ] Images: consider `<picture>` helper in `ResponsiveImage` for webp/avif sources in large hero/featured sections
- [ ] Lists: evaluate virtualization for large product grids
- [ ] Animations: consolidate Framer Motion usage behind variant helpers; memo pure cards

## Entities & Features – Consolidation

- [ ] Cart (`@entities/cart` / `@features/cart-drawer`):
  - [ ] Keep selectors (`getCartDetails`) and currency helpers under entities/lib
  - [ ] Add `AddToCartButton` as a small feature component if reused
- [ ] Products (`@entities/product` / `@features/shop`):
  - [ ] Centralize slug helpers and any mapping; remove `split('/').pop()` usage across code
  - [ ] Prepare for API-backed data (React Query keys, mappers)
- [ ] Services (`@entities/service` / `@features/services`):
  - [ ] Mirror shop structure for listing and (future) detail pages
- [ ] Home (`@features/home`):
  - [ ] Group sections; keep them presentational (no state)

## Accessibility Sweep

- [ ] Verify all interactive elements use correct roles (links vs buttons)
- [ ] Ensure visible focus outlines are consistent via CSS tokens
- [ ] Live regions limited to meaningful updates; throttle if needed
- [ ] Add keyboard navigation notes to README if custom patterns exist

## Testing Strategy

- [ ] Reorganize tests by feature (mirror source folders)
- [ ] Maintain semantic queries (`getByRole`) and remove brittle selectors
- [ ] Storybook (optional): add stories for primitives and feature components
- [ ] E2E: keep cart flow; add coverage when new flows ship (booking, etc.)

## CI & Linting

- [ ] GitHub Actions workflow: `ci.yml` running typecheck, lint, unit tests, build
- [ ] (Optional) Add Playwright to CI with `trace: on-first-retry`
- [ ] Enforce `import/order` with path groupings for new aliases

---

## Acceptance Criteria

- Project builds and tests pass at each phase.
- MobileNav and CartDrawer share a single dialog primitive with focus management.
- ProductDetail uses router params + loader; 404s gracefully.
- Reduced reliance on `global.css`; tokens introduced; fewer inline styles.
- Imports are readable via path aliases; folder structure mirrors feature boundaries.

## Rollout & Risk

- Rollout incrementally by phase; avoid behavior changes per PR.
- If regressions appear, revert the phase’s PR; code remains compatible with previous structure.

## Nice-to-haves (Post-refactor)

- Theme support via CSS variables
- Storybook visual regression (Playwright + story routes)
- Perf budget checks in CI (bundle size, Lighthouse)
