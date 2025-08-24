# Migration Checklist

A living, incremental checklist to track the Webflow → React migration and adjacent app features. Checked items are complete in the current codebase.

## Phase 0 – Bootstrap and Assets

- [x] Create Vite + React + TypeScript app with strict settings
- [x] Import Webflow CSS (`public/css`) and fonts/images
- [x] Add global overrides in `src/styles/global.css`

## Phase 1 – Layout & Navigation

- [x] Header with responsive navigation and mobile drawer
- [x] Footer with updated layout (CTA/newsletter removed)
- [x] Route shell with persistent Header/Footer via TanStack Router
- [x] Basic SEO helpers (`src/app/seo.ts`)

## Phase 2 – Pages and Routing

- [x] Home page sections (Hero, About blurb, Services grid, Featured products, Location spotlight, Community)
- [x] About, Shop, Services pages
- [x] Product detail page with dynamic `:slug` loader and 404 handling
- [x] Checkout page scaffold
- [x] 404 Not Found route
- [x] Reservation route (`/reservation`) to support CTA in Services grid
- [ ] Replace temporary stub routes (Blog/Contact/Pricing)

### From Webflow export (../mukyala): pages to port

- Reservation: `reservation.html` → Route `/reservation` with a booking form.
- Services: `services.html` and `detail_services.html` → Consider `/services/:slug` detail pages.
- Blog: `blog-pages/blog-v{1,2,3}.html` → Basic `/blog` index using static posts (optional for MVP).
- Locations: `locations-pages/locations-v{1,2,3}.html` → A single `/locations` page combining essentials.
- Team: `team.html` → `/team` with staff cards.
- Search: `search.html` → Defer unless a real index is added.

### Reservation page details (MVP)

Source: `../mukyala/reservation.html` shows fields:

- Name, Email, Phone
- Service (text), Day and month (text), Schedule (text)
- Message (textarea)

Tasks:

- [x] Add route `/reservation` in `src/router.tsx` and page `src/pages/Reservation.tsx`.
- [x] Replicate form UI with existing Webflow classes; ensure accessible labels and validation.
- [x] Submit handler: for MVP, simulate success (no backend) and show the success message card.
- [x] Persist submission locally (e.g., `localStorage: reservation:v1`) for manual follow-up.
- [x] Link Services grid CTA to `/reservation` (already points there) and ensure it passes.
- [x] Unit test: renders form and validates required fields.
- [ ] E2E test: fill form → submit → success message visible.

Stretch (post-MVP):

- [ ] Replace text fields with real pickers (date/time, service select from `src/data/services.ts`).
- [ ] Integrate booking provider (Calendly/Cal.com) or internal API.
- [ ] Add spam protection (honeypot/min-time/Rate limit).

### Services detail pages

Tasks:

- [x] Define service slugs in `src/data/services.ts` with content (hero image, description, duration, price).
- [x] Create `/services/:slug` route and page to render details.
- [x] Update cards/links to point to the new detail routes where applicable. (Cards already link via `href`.)
- [x] Tests: route loader 404s on unknown slug; page renders known service content.

### Blog index (simple static)

Tasks:

- [ ] Add `/blog` page that lists a few curated posts (static JSON to start).
- [ ] Replace stub component in `src/router.tsx` with the new page.
- [ ] Tests: list renders and links are accessible (can be external).

### Team and Locations

Tasks:

- [ ] Implement `/team` with staff cards (photo, name, role, short bio).
- [ ] Implement `/locations` with a single current location, map/link, hours, contact.
- [ ] Tests: headings visible; contact links clickable.

### Assets to copy/check

- [ ] Ensure reservation imagery exists in `public/images` (e.g., `three-women-happy-and-laugh...`).
- [ ] Ensure service images exist and srcset sizes follow the convention used in other sections.

## Phase 3 – Commerce & State

- [x] Cart state with `localStorage` persistence
- [x] Cart drawer UI with open/close flows
- [ ] Subtotals/tax/shipping calculations (currently unit-price only in tests)
- [ ] Checkout form and order submission flow

## Phase 4 – Interactions & Polish

- [ ] Replace Webflow interactions with Framer Motion components
- [ ] Image loading polish (skeletons/blur-up)
- [ ] Audit and reduce unused Webflow CSS

## Phase 5 – Data & Integrations

- [ ] Introduce React Query provider + patterns
- [ ] Replace static `src/data/*` with real API(s) for products/services
- [ ] Booking integration for reservations

## Testing & Tooling

- [x] Unit tests with Vitest + RTL, coverage target 80%
- [x] E2E tests with Playwright (`e2e/`)
- [x] ESLint flat config + Prettier + pre-commit hooks
- [ ] Playwright web server auto-start (or document running `npm run dev` before `test:e2e`)

## Notes / Known Gaps

- `framer-motion` and `@tanstack/react-query` are in dependencies but not used yet.
- The Services grid CTA links to `/reservation` which is now implemented.
