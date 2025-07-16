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
