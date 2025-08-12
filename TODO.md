# Shop Page – Modular Port Plan

This document outlines the step‑by‑step, modular plan to port the Webflow “Shop” page into the React app, and documents exactly where source content (HTML, CSS, images) comes from.

## Sources of Truth (Assets + Content)

- Webflow export folder: `../mukyala`
  - Page markup reference: `../mukyala/shop.html`
  - CSS imported by the app: `public/css/normalize.css`, `public/css/webflow.css`, `public/css/mukyala-2.webflow.css` (copied from `../mukyala/css/`)
  - Images: copied from `../mukyala/images/` into `public/images/`

- Product images currently used (already present under `public/images/`):
  - Baobab & Peptide Glow Drops: `baobab-peptide-glow-drops.jpg` (+ `-p-500.jpg`, `-p-800.jpg`)
  - Kalahari Hydration Jelly Pod Duo: `kalahari-hydration-jelly-pod-duo.jpg` (+ `-p-500.jpg`, `-p-800.jpg`)
  - Rooibos Radiance Antioxidant Mist: `rooibos-radiance-antioxidant-mist.jpg` (+ `-p-500.jpg`, `-p-800.jpg`)
  - Shea Gold Overnight Renewal Balm: `shea-gold-overnight-renewal-balm.jpg` (+ `-p-500.jpg`, `-p-800.jpg`)

Additional imagery can be added by placing files into `public/images/` and referencing them via string paths (e.g., `/images/...`).

## Scope

- Recreate the Shop listing page: hero heading + intro paragraph, followed by a product grid.
- No filtering/sorting yet; no PDP (product detail) routing in this phase.
- Reuse existing UI primitives and cards to keep the implementation small and testable.

## Component Architecture

- `src/pages/Shop.tsx`
  - Uses `Section` + `Container` for hero and grid areas.
  - Renders hero copy and `<ProductGrid products={...} />`.

- `src/components/shop/ProductGrid.tsx`
  - Props: `products: Product[]`
  - Layout: Webflow classes (e.g., `grid-3-columns packages-grid`) for consistency.
  - Child: `ProductCard` per item (already exists).

- Reuse: `src/components/cards/ProductCard.tsx` and `src/components/cards/ImageCardMedia.tsx`.

## Data & Types

- `src/types/product.ts`
  - `export interface Product { title: string; price: string; image: string; imageSrcSet?: string; href: string }`

- `src/data/products.ts`
  - Temporary static list derived from Webflow assets (see Sources above).
  - Future: replace with API and a `useProductsQuery()` hook using React Query.

## Routing

- Replace the current `/shop` stub route in `src/router.tsx` with the new `Shop` page component.
- Keep future route stubs in mind (e.g., `/shop/:slug`) but out of this PR.

## Styles & Accessibility

- Continue to use Webflow CSS via `src/styles/global.css` imports.
- Keep new CSS minimal (ideally none) by leveraging existing classes.
- Ensure each product image has a descriptive `alt` and each card’s link text is clear.
- Keyboard focus: standard links; no custom interactions introduced.

## Tests

- `src/pages/__tests__/Shop.test.tsx`
  - Renders hero heading “Shop” and intro paragraph.
  - Renders N products with title, price and links.

- `src/components/__tests__/ProductGrid.test.tsx`
  - Given a small product array, asserts grid renders correct number of `ProductCard`s and links.

## Rollout (Small PRs)

- [x] Types + data + grid
  - Add `Product` type and `src/data/products.ts` static list.
  - Add `ProductGrid` + tests. (Done in branch `feat/shop-port-plan`, commit `664e1d4`)

- [ ] Page + route
  - Add `Shop.tsx` hero + grid, wire `/shop` route in `src/router.tsx`.
  - Page tests and update nav link if needed.

- [ ] Polish (optional)
  - Expand product set, responsive assertions, handle empty state copy.

- [ ] Data hookup (future)
  - Introduce `useProductsQuery()` and connect to real API.
