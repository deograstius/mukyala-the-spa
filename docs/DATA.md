# Centralized Data Contracts

This document outlines the centralized data sources under `src/data/` and the shared types in `src/types/data.ts`. These modules are the single source of truth for catalog, site, contact, navigation, and social data.

## Modules

- `src/data/site.ts`
  - `site: SiteMeta` – brand name, logo alt text, and SEO title pattern.
  - `formatTitle(page: string): string` – helper to format document titles.

- `src/data/navigation.ts`
  - `navLinks: NavLink[]` – main navigation links.
  - `servicesLink: NavLink` – dedicated Services link for desktop/tablet.

- `src/data/contact.ts`
  - `defaultTimezone: string` – e.g., `America/Los_Angeles`.
  - `locations: Location[]` – supports multiple locations.
  - `primaryLocation: Location` – convenience pointer to the first location.
  - Each `Location` also includes `weekdayHours` and `weekendHours` strings for simple UI display, and `hoursByDay` for logic.

- `src/data/social.ts`
  - `socialLinks: SocialLink[]` – Instagram, TikTok, etc.

- `src/data/products.ts`
  - `shopProducts: Product[]` – product catalog with explicit `slug` and `priceCents`.

- `src/data/services.ts`
  - `services: ServiceItem[]` – service catalog with explicit `slug`, `duration`, optional `priceCents`.

- `src/data/featured.ts`
  - `featuredProductSlugs: string[]`
  - `featuredServiceSlugs: string[]`

## Shared Types (src/types/data.ts)

- `NavLink` – `{ label: string; path: string }`
- `SocialLink` – `{ key: string; label: string; url: string; icon: string; username?: string }`
- `TimeRange` – `{ open: 'HH:mm'; close: 'HH:mm' }`
- `HoursByDay` – `{ mon..sun: TimeRange[] }`
- `Address` – `{ line1; line2?; city; state; postalCode; country }`
- `ContactPhone` – `{ tel; display }`
- `Location` – `{ id; name; address; mapUrl; phone; email; timezone; hoursByDay; weekdayHours?; weekendHours? }`
- `SiteMeta` – `{ name; logo: { main; altText }; seoTitlePattern }`

Catalog:

- `Product` – `{ slug?; title; priceCents; image; imageSrcSet?; imageSizes?; href }`
- `ServiceItem` – `{ slug?; title; href; image; imageSrcSet?; imageSizes?; description?; duration?; priceCents? }`

## Usage Conventions

- Import from `@data/*` in components/pages instead of defining local constants.
- Use `setBaseTitle(page)` (from `src/app/seo.ts`) to format titles via `site` data.
- For hours display, prefer `weekdayHours` and `weekendHours`. For validation/business logic, use `hoursByDay`.
- Route loaders should match by explicit `slug` (fallback to deriving from `href` if missing).

## Examples

### Site

```ts
import { formatTitle } from '@data/site';
document.title = formatTitle('About'); // "About – Mukyala Day Spa"
```

### Navigation (Header)

```ts
import { navLinks, servicesLink } from '@data/navigation';
// Render navLinks for regular items, append servicesLink on desktop/tablet
console.log(navLinks.length, servicesLink.path);
```

### LocationSpotlight

```ts
import { primaryLocation } from '@data/contact';
// Address, phone, email, mapUrl
// Hours display uses primaryLocation.weekdayHours / weekendHours
console.log(primaryLocation.name);
```

### Featured Products

```ts
import { featuredProductSlugs } from '@data/featured';
import { shopProducts } from '@data/products';
const items = featuredProductSlugs
  .map((slug) => shopProducts.find((p) => p.slug === slug))
  .filter((p): p is NonNullable<typeof p> => Boolean(p));
console.log(items.length);
```

### Router loaders by slug

```ts
const product = shopProducts.find((p) => (p.slug ?? getSlugFromHref(p.href)) === params.slug);
if (!product) {
  // handle not found (404)
}
```

## Asset Guidelines

- Image paths referenced in data modules must exist under `public/images`.
- Use responsive variants in `imageSrcSet` when available (e.g., `-p-500`, `-p-800`).
- SVG icons should live in `public/images/` or `public/icons/` and be referenced by absolute `/images/...` or `/icons/...` paths.

## Testing Notes

- Header tests import `navLinks` to assert paths.
- Community tests ensure the Instagram CTA uses the centralized URL.
- LocationSpotlight tests assert address/phone/email and hours text from data.
- Reservation tests assert dynamic opening-hour validation derived from contact data.
