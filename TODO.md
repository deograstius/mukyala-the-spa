# Mukyala Day Spa – Remaining Tasks

This file only lists features that are **not yet implemented** in the React-based codebase. Everything already completed has been removed for clarity.

## 1 · Home page sections still missing

| Section                            | Planned file            | Source snippet (home-v1.html)                                     | Key assets                                                                                | Status |
| ---------------------------------- | ----------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------ |
| Featured products slider           | `FeaturedProducts.tsx`  | `<div class="slider-wrapper buttons-center---mbl w-slider">`      | Product images, arrow icons (font)                                                        | ✅     |
| Location spotlight (New York card) | `LocationSpotlight.tsx` | `<div class="w-layout-grid grid-2-columns location-image-right">` | `new-york-location-short-image-hair-x-webflow-template.jpg` plus address/phone/hours copy | ✅     |

Completion checklist for each section:

1. JSX/TSX component in `src/components/sections/`.
2. Uses original class names; no `data-w-*` attributes.
3. Responsive styling matches Webflow on desktop/tablet/mobile.
4. Accessible – slider must be keyboard-operable; location links get proper `href`.
5. Add component to `pages/Home.tsx` in the right order.

## 2 · Routing

Set up client-side routing with TanStack Router: ✅

1. Configure `router.tsx` with root and `/` (Home) route. ✅
2. Update `main.tsx` to render `<RouterProvider />`. ✅
3. Stub pages for `/about`, `/services`, etc., so the nav links don’t 404. ✅

## Low-priority / Stretch-polish backlog

The items below are nice-to-have improvements that can be scheduled after all
core functionality is complete:

• Replace icon web-fonts with inline SVG sprites (or a React-icon solution).  
• Remove unused Webflow CSS; consider adopting CSS-Modules or Tailwind.  
• Add Lighthouse CI and target ≥ 90 performance score on mobile.  
• Set up a GitHub Actions workflow that runs lint, tests and the production
build on every push / pull request.

## 3 · Testing & Coverage – Next Steps

Goal: reach ≥ 80 % useful coverage on code **we own** (files in `src/**`).

Planned tasks:

1. Enable coverage in Vitest
   • vite.config.ts → add `coverage` section with provider `c8`, reporters `text`, `html`, `lcov`.
   • Include only `src/**`; exclude `src/test/**`, `**/*.d.ts`, story files, vendor code.

2. Set fail-thresholds
   • `statements`, `branches`, `lines`, `functions`: `80`.

3. Mark intentional gaps
   • Use `/* istanbul ignore next */` or `/* istanbul ignore file */` for code paths we purposely skip.

4. Write behaviour-centric tests (Testing Library + Vitest)
   • Header & navigation links.
   • Footer copyright line.
   • HeaderDropdown open/close (mouse & keyboard).
   • Mobile nav toggle.
   • FeaturedProducts slider next/prev buttons.
   • Router smoke test (memory router → About page, 404, etc.).
   • Pure utility helpers once they exist.

5. CI integration
   • Extend planned GitHub Action to run `vitest --coverage` and fail if below thresholds.
   • Upload HTML coverage report as artifact for easy inspection.

## 4 · UI Modularization Plan

Goal: reduce duplication, standardize accessibility and styling, and make sections easier to extend.

New reusable components (to add under `src/components/`):

- [ ] `ui/ResponsiveImage.tsx` – wraps `<img>` with sensible defaults
  - Props: `src`, `alt`, `srcSet?`, `sizes?`, `loading? = 'lazy'`, `className?`
  - Replace raw `<img>` in Hero, About hero, ServicesGrid, FeaturedProducts, Community, LocationSpotlight

- [ ] `ui/ButtonLink.tsx` – anchor styled as button
  - Props: `href`, `children`, `variant? = 'primary' | 'white' | 'link'`, `size? = 'large' | 'md'`, `className?`
  - Use in Hero, AboutBlurb, FeaturedProducts CTA, and other CTAs

- [ ] `cards/ProductCard.tsx`
  - Props: `{ title, price, image, imageSrcSet?, href }`
  - Used by FeaturedProducts

- [ ] `cards/ServiceCard.tsx`
  - Props: `{ title, image, imageSrcSet?, href }`
  - Used by ServicesGrid

- [ ] `ValueItem.tsx` – icon + title + paragraph block
  - Props: `iconSrc`, `title`, `children`
  - Used by About page values list

- [ ] `BulletItem.tsx` – dot + content row; optional link variant
  - Props: `children`, `href?`
  - Used by LocationSpotlight (address / phone / email / hours)

Refactors (files to update):

- [ ] `src/components/sections/FeaturedProducts.tsx` → use `ProductCard`, `ButtonLink`, `ResponsiveImage`
- [ ] `src/components/sections/ServicesGrid.tsx` → use `ServiceCard`, `ResponsiveImage`
- [ ] `src/pages/About.tsx` → use `ValueItem`, `ResponsiveImage` for hero/values images
- [ ] `src/components/sections/LocationSpotlight.tsx` → use `BulletItem`, `ResponsiveImage`
- [ ] `src/components/sections/Hero.tsx` and `src/components/sections/AboutBlurb.tsx` → swap CTA anchors to `ButtonLink`

Done when:

- [ ] Lint, typecheck and tests pass
- [ ] Visuals remain consistent with Webflow styles
- [ ] README updated if new conventions emerge
