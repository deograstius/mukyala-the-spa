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
