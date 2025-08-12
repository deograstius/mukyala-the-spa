# Mukyala Day Spa – UI Modularization Plan

Goal: reduce duplication, standardize accessibility and styling, and make sections easier to extend.

New reusable components (to add under `src/components/`):

- [x] `ui/ResponsiveImage.tsx` – wraps `<img>` with sensible defaults
  - Props: `src`, `alt`, `srcSet?`, `sizes?`, `loading? = 'lazy'`, `className?`
  - Replace raw `<img>` in Hero, About hero, ServicesGrid, FeaturedProducts, Community, LocationSpotlight

- [x] `ui/ButtonLink.tsx` – anchor styled as button
  - Props: `href`, `children`, `variant? = 'primary' | 'white' | 'link'`, `size? = 'large' | 'md'`, `className?`
  - Use in Hero, AboutBlurb, FeaturedProducts CTA, and other CTAs

- [x] `cards/ProductCard.tsx`
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
