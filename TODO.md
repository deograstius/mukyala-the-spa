Scroll Reveal Animations ("Come From Down") – Plan

Source mapping (Webflow export)

- Mechanism: Webflow IX2 (Interactions 2.0) + tram tweens.
- Targets: Elements marked with `data-w-id` start with inline styles like `transform: translate3d(0, 10%, 0); opacity: 0`.
- Trigger: Scroll into view. Action animates to `translateY(0)` and `opacity: 1`.
- Examples observed:
  - services.html: `.inner-container._518px.center` has `data-w-id="379e8594-e2ff-3c36-d335-3f5b9bf415d8"` with initial `translateY(10%)` + `opacity: 0`.
  - index.html: hero H1, paragraph, and buttons carry `data-w-id` with the same initial transform + opacity.

Implementation approach (React app)

Option A — Framer Motion (preferred)

1. Create `Reveal` primitive
   - `motion.div` wrapper with variants: from `{ y: distance, opacity: 0 }` to `{ y: 0, opacity: 1 }`.
   - Props: `distance=40`, `duration=0.6`, `delay=0`, `easing='easeOut'`, `once=true`, `amount=0.2`.
   - `whileInView` with `viewport={{ once, amount }}`.
   - Respect `prefers-reduced-motion`: disable motion, render visible.

2. Add `Reveal.Stagger`
   - Parent `motion.div` that staggers children with `staggerChildren=0.06` (configurable).
   - Use for card grids and stacked text blocks.

3. Instrument key surfaces
   - Home: hero heading/paragraph/CTA; Services grid cards; Featured products slides (content overlay only); About values items.
   - Shop: hero heading/paragraph and product grid items.
   - Reservation/Checkout: headings and primary CTAs.

4. Non-intrusive usage
   - Wrap only content containers (avoid animating large images themselves).
   - Keep DOM positions stable; transforms shouldn’t affect layout.

5. Accessibility & motion preferences
   - Use `useReducedMotion()` to render final state immediately when reduced motion is preferred.
   - Avoid large distances or parallax.

6. Performance
   - Use `viewport.once` to animate a single time.
   - Limit observers by staggering via a single parent where possible.
   - Avoid animating properties that trigger layout; use `transform` + `opacity` only.

7. Theming & tokens
   - Keep distances in a small set (e.g., 24, 32, 40) to match existing spacing rhythm.
   - Expose defaults via a small config (exported constants).

8. Testing & QA
   - Unit: `Reveal` respects `useReducedMotion` and applies expected variants.
   - E2E: Scroll pages and assert elements become visible (opacity → 1) and receive `aria-live` not impacted.
   - Cross-browser spot checks (Chrome/Safari/Firefox) and mobile.

Option B — IntersectionObserver + CSS classes

1. Hook: `useInViewOnce` to add a class when entering viewport (threshold 0.2).
2. CSS: `.reveal-down` sets initial `transform: translateY(var(--reveal-distance, 40px)); opacity: 0;` and `.is-visible` transitions to `transform: translateY(0); opacity: 1;` with `transition: transform 600ms ease, opacity 600ms ease`.
3. Respect `prefers-reduced-motion`: disable transitions and initial transforms.
4. Stagger via inline `transition-delay` or parent data attributes.

Rollout checklist

- [x] Add `Reveal` primitive(s) (`Reveal`, `Reveal.Stagger`).
- [x] Wire reduced-motion guard.
- [x] Apply to: Home hero H1/p/CTA; Services cards; Featured products (content only); About values items; Shop hero + product grid.
- [ ] Tune defaults: distance 32–40px, duration 500–700ms, easeOut.
- [ ] Add Story/Docs snippet in `docs/COMPONENTS.md`.
- [ ] Add basic tests (unit + a small E2E scroll check).

Notes

- This closely mirrors Webflow’s “come from down” effect: initial `translateY(10%) / opacity: 0` → animate to `0 / 1` on scroll into view with gentle easing.
- If we need exact easing/durations from the export, capture via DevTools Performance panel on the static `../mukyala` pages; otherwise use `easeOut` ~600ms which matches the feel.
