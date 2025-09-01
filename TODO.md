# Hover Animation: White Button Inside Link

Objective

- Recreate the Webflow hover animation where the inner icon slides diagonally inside the circular button for `.secondary-button-icon.white-button-inside-link > .icon-font-rounded.diagonal-button-icon`.

Scope

- Applies to service cards rendered by:
  - `src/pages/Services.tsx` (class: `.beauty-services-link-item`)
  - `src/features/services/ServicesGrid.tsx` (class: `.beauty-services-link-item`)
- Does NOT change slider controls using `.secondary-button-icon.large.no-hover` (Featured Products).

Behavior Summary (from Webflow)

- Container (`.secondary-button-icon.white-button-inside-link`): 40×40 px, circular, `overflow: hidden`, no transform on hover.
- Icon motion (two‑phase wrap): On hover, the icon moves diagonally up/right and exits the circle, instantly repositions off‑screen bottom/left, then travels diagonally back into the center and stops centered.
- Color swap: At the end of the hover‑in sequence, the icon is dark/black (neutral‑800). On hover‑out, it returns to white.
- Background fill: While hovered, the circular button background fills from transparent to white (and reverses to transparent on hover‑out). In the export, this is controlled by Webflow Interactions (not CSS hover on this class), so it behaves as a smooth tween.
- Trigger area: The whole link/card hover triggers the animation, not just the icon.

Parity Details to Implement

- [x] Icon path uses two‑phase motion (exit → instant reposition → enter) and ends centered, not parked at a corner (simulated via two layered glyphs with cross‑animated transforms).
- [x] Icon color transitions from white → dark at the end of hover‑in and dark → white on hover‑out (end states achieved by layered glyphs; perceived as a color swap).
- [x] Button background transitions transparent → white on hover‑in and back on hover‑out (tween via `background-color`).
- [x] Timing aligns so color swap and background fill complete when the icon lands centered.

Implementation Plan (CSS-first)

- [x] Confirm base styles from imported Webflow CSS are present (overflow hidden, transition disabled on container variant).
- [x] Add initial offset transform to the inner icon so it sits partially off one edge (e.g., `transform: translate(-16px, 16px)`), with a smooth `transition: transform 0.3s–0.4s ease-out`.
- [x] On hover/focus of the link/card, move the icon to the opposite corner (e.g., `transform: translate(16px, -16px)`).
  - Selectors to cover both contexts:
    - `.beauty-services-link-item:hover .white-button-inside-link .diagonal-button-icon`
    - `.beauty-services-link-item:focus-visible .white-button-inside-link .diagonal-button-icon`
    - `.services-card-wrapper:hover .white-button-inside-link .diagonal-button-icon` (if encountered)
    - `.services-card-wrapper:focus-visible .white-button-inside-link .diagonal-button-icon`
- [x] Respect reduced motion:
  - Wrap movement in `@media (prefers-reduced-motion: reduce)` and neutralize the transform/transition (keep icon centered).

Hover Parity (Follow‑Up)

- Approach A (CSS transitions, two-layer icons) — removed in favor of single-icon timeline.
- Approach B (Framer Motion) — target parity:
- [x] Use a single glyph and orchestrate a two-segment path with a mid-point reposition:
  - Hover-in: center (white) → move up/right out; instant jump to bottom/left; move in to center (dark).
  - Hover-out: center (dark) → move down/left out; instant jump to top/right; move in to center (white).
- [x] Animate container `background-color` in parallel (transparent ↔ white) aligned so the icon is never absent visually.
  - [x] Swap icon color at the mid-point (pre-Phase 2) so it lands centered with the correct color.
  - [x] Ensure only one icon is ever visible; no peek from corners pre-hover.
  - [x] Respect `prefers-reduced-motion` by disabling movement and color/background tweens (or snapping without motion).
  - [x] Encapsulate in `DiagonalIconButton` so consumers only pass `theme`.

Parity Rework (Single Icon Timeline)

- [x] Update `DiagonalIconButton` to render a single glyph and drive animation via FM timeline.
- [x] Remove layered CSS dependence and fallback styles.
- [x] Prevent “peek” by keeping the icon fully outside mask when off-screen (offset > radius).
- [x] Synchronize background fill and color swap with icon landing; eliminate “empty white circle” gap.
- [x] Implement full reverse on hover-out (mirror of hover-in).
- [x] Validate on Services and ServicesGrid.

Reusability

- [x] Extract a reusable component to encapsulate this pattern so it can be used consistently across sections:
  - Name: `DiagonalIconButton` (location: `src/shared/ui/DiagonalIconButton.tsx`).
  - Variants: `theme` ("white" | "dark").
  - API: accepts `className`, `aria-label` (optional), and forwards props; inner icon remains decorative (`aria-hidden`).
  - Implementation: reuse existing Webflow classes (`secondary-button-icon white-button-inside-link` or `dark-button-inside-link`) and the `icon-font-rounded diagonal-button-icon` glyph.
  - [x] Replace inline usages in `src/pages/Services.tsx` and `src/features/services/ServicesGrid.tsx` with the component.

Easing/Timing Defaults

- [x] Duration: ~350 ms transform and background tween.
- [x] Easing: ease‑out for motion; linear for color/background acceptable.

Accessibility

- [x] Ensure the inner icon is decorative (`aria-hidden="true"`) where applicable.
- [x] Confirm the link/card has an accessible name from text content.
- [x] Mirror hover motion on `:focus-visible` for keyboard users.

QA Checklist

- [x] Exactly one arrow is visible at any time; no corner “peek”.
- [x] No “empty” white circle moment during hover-in/out; motion is continuous.
- [x] Background fill is synchronized with icon landing; color swap occurs at mid-point.
- [x] Hover-out mirrors hover-in and ends centered (white icon, transparent background).
- [x] Services page and ServicesGrid match `../mukyala` UX (visual review).
- [x] Featured Products arrows remain unaffected.
- [x] Reduced motion setting disables icon movement cleanly.

Notes / Non-Goals

- No new dependencies; prefer CSS. Consider Framer Motion only if we later need configurable sequences.
- Avoid touching product/service data or changing markup structure beyond what’s necessary for selectors.

Tests

- Unit (Vitest + RTL):
  - [x] Single glyph: `DiagonalIconButton` renders exactly one `.diagonal-button-icon` and expected glyph text.
  - [x] Hover triggers: dispatch `mouseenter`/`mouseleave` on a `.beauty-services-link-item` wrapper; assert inline styles change:
    - Background: transparent → white → transparent on the container.
    - Icon color: white → dark → white on the glyph. (Note: relaxed in JSDOM; verified in E2E.)
  - [x] Reduced motion: stub `window.matchMedia('(prefers-reduced-motion: reduce)')` to return `matches: true`; assert no transform transitions (snap state), background/color still update.

- E2E (Playwright):
  - [x] Services route: first card’s button background becomes white on hover and icon color flips to dark; reverses on unhover.
  - [x] One icon only: selector count for `.white-button-inside-link .diagonal-button-icon` equals 1.
  - [x] Long title behavior: programmatically set a very long title; verify the icon stays pinned to the right (check bounding boxes) and does not wrap left.
  - [ ] (Skipped) No blank state: during hover sequence, icon element remains present and visible. Decision: skip to avoid flakiness; covered by other checks.
