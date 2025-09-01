# Shop Card Parity (with Webflow)

Objective

- Align Shop product cards with the Webflow design: image with overlay “+” button; title/price row below the image.

Scope

- Page: `/shop` (Shop.tsx → ProductGrid → MediaCard)
- Components touched: `ProductGrid`, `MediaCard` composition, optional small Shop-specific wrapper if needed.

Implementation Checklist

- Overlay control:
  - [x] Add the overlay “+” icon on the product image via `overlayChildren` using Webflow classes:
    - `.button-icon-inside-link-wrapper` → `.secondary-button-icon.large.no-hover` → `.accordion-icon-wrapper.inside-button` → two `.accordion-icon-line` (one `.vertical`).
  - [x] Apply color-only hover (hover-only): button fills dark (neutral-800), “+” lines turn white; revert on mouseout.
  - [x] Scope the hover rules to the Shop grid to avoid affecting other sections.

- Title/price row below image:
  - [x] Render the row beneath the image (do not use `content-inside-image-bottom`).
  - [x] Layout: price on the left, title on the right (reverse of our default). Implemented via CSS row-reverse for Shop grid.
  - [x] Ensure long titles wrap without shifting the price (reserve space, pin alignment).

- Parity and a11y:
  - [ ] Match spacing, sizes, and positions to `../mukyala/shop.html` (button position, margins, text sizes).
  - [ ] Mark overlay “+” as decorative (`aria-hidden="true"`).
  - [ ] Keep behavior hover-only (per preference) to guarantee reliable revert on mouseout.

Tests

- Unit (Vitest + RTL):
  - [ ] Shop card renders overlay “+” icon with correct classes.
  - [ ] Hover sets button background dark and “+” lines white; unhover reverses.
  - [ ] Title/price row below image with price-left/title-right order.

- E2E (Playwright):
  - [ ] On `/shop`, product tiles show the overlay “+”; hover color swap works and reverts on mouseout.
  - [ ] Price appears left, title right in the row below; long titles wrap without moving the price.
  - [ ] No interference with Featured Products’ behavior.
