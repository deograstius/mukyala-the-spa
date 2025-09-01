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
- Inner icon (`.diagonal-button-icon`): slides diagonally within the circle on hover of the parent link; the button itself doesn’t scale or recolor.
- Trigger area: the whole link/card hover triggers the animation, not just the icon.

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

Reusability

- [ ] Extract a reusable component to encapsulate this pattern so it can be used consistently across sections:
  - Name: `DiagonalIconButton` (location: `src/shared/ui/DiagonalIconButton.tsx`).
  - Variants: `theme` ("white" | "dark").
  - API: accepts `className`, `aria-label` (optional), and forwards props; inner icon remains decorative (`aria-hidden`).
  - Implementation: reuse existing Webflow classes (`secondary-button-icon white-button-inside-link` or `dark-button-inside-link`) and the `icon-font-rounded diagonal-button-icon` glyph.
  - [ ] Replace inline usages in `src/pages/Services.tsx` and `src/features/services/ServicesGrid.tsx` with the component.

Easing/Timing Defaults

- [ ] Duration: 300–400 ms.
- [ ] Easing: ease-out (or `cubic-bezier(0.22, 1, 0.36, 1)` if needed for parity).

Accessibility

- [ ] Ensure the inner icon is decorative (`aria-hidden="true"`) where applicable.
- [ ] Confirm the link/card has an accessible name from text content.
- [ ] Mirror hover motion on `:focus-visible` for keyboard users.

QA Checklist

- [ ] Services page cards animate the diagonal icon on hover and focus-visible.
- [ ] No background/scale change on the `.white-button-inside-link` container.
- [ ] Featured Products arrows remain unaffected.
- [ ] Reduced motion setting disables movement cleanly.
- [ ] Visual parity with `../mukyala` (compare against Services and Home v2 sections).

Notes / Non-Goals

- No new dependencies; prefer CSS. Consider Framer Motion only if we later need configurable sequences.
- Avoid touching product/service data or changing markup structure beyond what’s necessary for selectors.
