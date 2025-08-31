# Shared Components Overview

Brief reference for common, reusable components and patterns. Keep visuals consistent with existing Webflow classes and prefer these primitives over ad‑hoc markup.

## Layout

- Section: Semantic wrapper for sections. Props: `as`, `className`.
- Container: Standard content width wrapper. Props: `as`, `className`.
- Grid: Minimal wrapper that forwards classes (e.g., `grid-2-columns`).
- List / ListItem: Accessible list structure for grids and collections.
- DetailLayout: Two-column detail page shell with slots: `media`, `title`, `meta`, `description`, `actions`.

## Cards

- ImageCardMedia: Consistent image wrapper for cards (wrapper, overlay, image classes).
- MediaCard: Generic media tile with optional price and actions.
  - Props: `title`, `href`, `priceCents?`, `image*`, class hooks for wrapper/image/overlay/content/title, `rightElement` slot.
  - Use for both products and services to remove duplication.
- OverlayCardLink: Image link with overlay + icon + label (used by Community).
  - Props: `href`, `iconSrc`, `imageSrc(, srcSet, sizes)`, `alt`, `hiddenMobile?`, `label`.

## UI

- Button / ButtonLink: Standard button styles; `variant` (primary|white|link), `size` (md|large).
- ResponsiveImage: `<img>` wrapper with sensible defaults (`loading`, `decoding`).
- SectionHeader: Left-title/right-actions header block for sections.
- Price: Renders currency from `cents` using `utils/currency`.
- Reveal: Scroll-reveal wrappers powered by Framer Motion.
  - `Reveal`: Animates children from slight translateY + opacity 0 to natural position with opacity 1 when scrolled into view.
    - Props: `distance=40` (px), `duration=0.6` (s), `delay=0` (s), `once=true`, `amount=0.2` (viewport intersection).
    - Respects prefers-reduced-motion: renders without animation.
  - `RevealStagger`: Convenience component that applies small incremental delays to a list of children.
    - Props: `interval=0.06` (s), `startDelay=0` (s), plus optional `distance`, `duration`, `once`, `amount` forwarded to each child.
  - Usage:

    ```tsx
    import Reveal, { RevealStagger } from '@shared/ui/Reveal';

    <Reveal>
      <h2 className="display-9 text-center">Featured products</h2>
    </Reveal>

    <RevealStagger>
      {items.map((it) => (
        <Card key={it.id} {...it} />
      ))}
    </RevealStagger>
    ```

## Accessibility

- Dialog: Accessible modal overlay (Escape to close, focus trap, scroll lock). Props: `open`, `onClose`, `ariaLabel`/`ariaLabelledBy`, `panelSelector`, `stayMountedOnClose`.
- SlideOver: Dialog-based side panel with slide in/out + overlay fade.
  - Props: `side`, `width`, `panelAs`, `panelClassName`, `panelStyle`.
- LiveRegion: Visually hidden polite/assertive status region for cart or form updates.

## Forms

- FormField: Wraps a single control, renders label/help/error. Injects `aria-invalid` + `aria-describedby`.
- InputField / SelectField / DateTimeField / PhoneInput: Basic controls with standard classes.

## Utilities & Tokens

- tokens.css: Colors, spacing, radii, z‑index, animations, helpers.
  - Aspect: `.aspect-square` for 1:1 media wrappers.
  - Animations: slide/fade utility classes for overlays/panels.
  - Community: `.social-media-feed---image-overlay` slightly visible by default; brightens on hover.

## Data & Pricing

- Products and services store prices as integers (`priceCents`).
- Render with `Price`; do not compute with formatted strings.
