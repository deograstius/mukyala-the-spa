# Component Refactor TODO

Goal: Increase reuse and consistency with minimal churn, keep styles, and add tests incrementally per phase so we never batch tests at the end.

## Principles

- Minimal API: Small, focused props; keep `className` passthrough.
- Composition over config: Prefer tiny wrappers over mega components.
- Keep styles: Reuse existing classes; avoid CSS system changes.
- Accessibility: Preserve semantics; add ARIA/keyboard support where useful.

## Layers

- Primitives (ui): `Section`, `Container`, `SectionHeader`, `ButtonLink`, `ResponsiveImage`.
- Building blocks: `BulletItem`, `ValueItem`, `MobileNav`, `HeaderDropdown`.
- Cards: `ProductCard`, `ServiceCard` (later: shared shell).
- Sections/pages: Feature-specific compositions using the above.

## What’s Done

- [x] Added `Section`, `Container`, `SectionHeader` and adopted in `Hero`, `ServicesGrid`, `FeaturedProducts`, `LocationSpotlight`, `Footer`, `AboutBlurb`, `Community`, `About`.
- [x] All tests are passing.

## Phase 1 — Adopt Primitives Broadly (low effort, high value)

Tasks

- [x] Replace container divs with `Container` where present.
- [x] Wrap top-level blocks with `Section` on remaining sections/pages.
- [x] Use `SectionHeader` for recurring title + actions rows.

Tests (write during this phase)

- [x] Unit: `Section` renders children + merges classes.
- [x] Unit: `Container` renders children + merges classes.
- [x] Unit: `SectionHeader` renders title (as h2 by default) and optional actions.
- [x] Update any section tests if heading structure changes (keep semantics stable).

## Phase 2 — Buttons Parity

Tasks

- [x] Add `Button` (pair to `ButtonLink`) sharing variants/sizing.
- [x] Replace ad hoc buttons where appropriate.

Tests

- [x] Unit: `Button` applies variant/size classes, forwards props, and renders children.
- [x] Integration: One representative section using `Button` still passes existing tests.

## Phase 3 — Nav Links Centralization

Tasks

- [x] Create `constants/navLinks.ts` with `{ label, path }`.
- [x] Use in `Header`, `MobileNav`, and (optionally) `Footer` to avoid drift.

Tests

- [x] Header: Asserts links still point to correct routes.
- [x] MobileNav: Asserts the same set of links render; Escape/overlay click still closes.
- [ ] Optional: Snapshot or string match to ensure labels are sourced from constants.

## Phase 4 — Card Shell Extraction (keep lean)

Tasks

- [x] Add `ImageCardShell` for common overlay + image wrapper.
- [x] Refactor `ProductCard` and `ServiceCard` to use shell while keeping unique content.

Tests

- [x] Unit: `ImageCardShell` renders image/overlay correctly.
- [x] ProductCard/ServiceCard: Existing tests still pass (title, href, price where applicable).

## Phase 5 — Small Layout Helpers (optional)

Tasks

- [x] Add tiny `Stack` / `Inline` if repeated flex/grid patterns keep showing up.

Tests

- [x] Unit: Helpers render children and compose classes (very light coverage).

## Phase 6 — Accessibility Polishing (as needed)

Tasks

- [ ] Consider simple focus trap for `MobileNav` (optional).
- [x] Validate dropdown and carousel ARIA.

Tests

- [x] Interaction: `MobileNav` focuses first actionable element on open and closes on Escape/overlay click.
- [ ] Interaction: Dropdown closes on outside click and Escape (expand test coverage if needed).

## Phase 7 — Migration & Cleanup

Tasks

- [x] Adopt wrappers opportunistically in untouched files when edited.
- [ ] Remove dead code/duplicate patterns discovered along the way.

Tests

- [x] Run full test suite after each incremental adoption.
- [x] Add/adjust unit tests only where behavior can regress; avoid unnecessary coverage churn.

## Non-Goals

- No design system or theming overhaul.
- No CSS-in-JS or utility framework changes.
- No router/layout rewrite.

## Working Agreement

- Implement + test within each phase before moving to the next.
- Keep commits small and descriptive; prefer iterative PRs.
- Preserve existing class names to avoid CSS regressions.
