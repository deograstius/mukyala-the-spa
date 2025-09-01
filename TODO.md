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

- Approach A (CSS transitions, two-layer icons):
  - [x] Use two stacked glyphs (white centered, dark offset) and cross-animate transforms on hover to simulate exit/re-enter without mid-animation teleport.
  - [x] Animate container `background-color` to white on hover and back on hover-out.
  - [x] Ensure end state is centered dark icon on hover-in; centered white icon on hover-out.
- Approach B (Framer Motion):
  - [ ] Orchestrate a timeline for icon motion (exit → instant reposition → enter) and parallel tweens for background and icon color.
  - [ ] Use `prefers-reduced-motion` to disable the sequence gracefully.
  - [ ] Encapsulate logic in `DiagonalIconButton` so consumers only pass `theme`.

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

- [x] Services page cards animate the diagonal icon on hover and focus-visible.
- [x] Background transitions to white on hover; no unintended scale change on the container.
- [x] Featured Products arrows remain unaffected.
- [x] Reduced motion setting disables icon movement cleanly.
- [x] Visual parity matches `../mukyala` for the service cards’ overlay control (Services and Home v2 sections).

Notes / Non-Goals

- No new dependencies; prefer CSS. Consider Framer Motion only if we later need configurable sequences.
- Avoid touching product/service data or changing markup structure beyond what’s necessary for selectors.
