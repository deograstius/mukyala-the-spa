# Mukyala Day Spa – Web Application

[![Frontend CI](https://github.com/deograstius/mukyala-the-spa/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/deograstius/mukyala-the-spa/actions/workflows/ci.yml)

Welcome to the codebase for **Mukyala Day Spa**, a modern React + Vite application that delivers the spa’s timeless luxury and old-school customer service in a digital experience.

---

## 🧭 Project Purpose

The goal of this repository is to rebuild the exported Webflow marketing site as clean, maintainable React components while adding true application features such as routing, booking, commerce, and AI-powered recommendations.

## 🛠 Tech Stack

The project is built on a modern, **strict-typed** React tool-chain that boots up in milliseconds and provides instant HMR (hot-module reload) while you code.

| Layer                   | Library / Tool                | Notes                                                                                         |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| Build & Dev Server      | **Vite 7**                    | ESBuild-powered, <50 ms cold-start, React Fast-Refresh baked-in                               |
| UI                      | **React 19**                  | Concurrent features-ready                                                                     |
| Language                | **TypeScript 5**              | `strict`, `moduleResolution: "bundler"`, zero-emit – the bundler handles compilation          |
| Routing                 | **@tanstack/react-router v1** | Type-safe routes with first-class loaders and `notFound()` handling                           |
| Data Fetching / Caching | **@tanstack/react-query v5**  | QueryClientProvider wraps the app (see `src/main.tsx`) to hydrate `/v1/home` + future fetches |
| Animations              | **Framer Motion v12**         | Present in deps; not used yet in code                                                         |
| Linting                 | **ESLint 9** flat-config      | `typescript-eslint`, `react-hooks`, `jsx-a11y`, `import`, `prettier`                          |
| Formatting              | **Prettier 3**                | Runs automatically on staged files via **lint-staged**                                        |
| Git Hooks               | **simple-git-hooks**          | Zero-dependency replacement for Husky                                                         |

> Looking for the exact versions? See `package.json`.

---

## ✨ Brand Values

Mukyala isn’t just another spa; it is an ethos built on respect, timeless elegance, and nurturing technology. These values drive both our in-person service and every line of code in this app.

| Pillar                                         | What it means                                                   | Real-world example                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Old-School Customer Service for Everyone**   | We know our guests by name and treat each with genuine respect. | The receptionist greets a long-time guest by name and remembers their favourite treatment. |
| **Luxury & Timeless Experiences**              | Every interaction should feel indulgent and enduring.           | Warm essential-oil towels are offered during a massage to elevate relaxation.              |
| **Technology that Enhances, not Hurries**      | AI and notifications encourage, never pressure.                 | A push reminder says _“We think your skin will love this!”_ instead of a hard sell.        |
| **Consistency through Positive Reinforcement** | Gentle, celebratory nudges help guests stay on track.           | _“Great job! Your skin is glowing after 3 facials – let’s keep the momentum!”_             |
| **Competent, Cordial & Human**                 | Knowledgeable, polite, never insincere.                         | Staff research an answer rather than give a vague response.                                |
| **Attraction, not Chase**                      | Quality & authenticity draw people in; loyalty is earned.       | Invitation-only events replace frequent discount blasts.                                   |
| **Timeless Elegance in Every Detail**          | Classic décor, quality products, refined UX.                    | Treatment rooms feature classic art and natural fragrances.                                |
| **Unwavering Respect for All**                 | Inclusivity & confidentiality are non-negotiable.               | Personal details shared in treatment remain private.                                       |

These principles influence UI copy, notification tone, colour selection, and even performance budgets (luxury feels smooth, never rushed).

---

## 🪧 Brand & SEO

Source-of-truth files for the public brand surface (NAP, prices, social-share image,
ribbon promo, structured data). Shipped as part of chunk
`spa-launch-readiness-seo-2026-05-09`.

### Where things live

| Concern                                | Canonical source                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Name / Address / Phone (NAP) + hours   | `src/data/contact.ts` (`primaryLocation`)                                                                    |
| Service catalog (titles, prices, copy) | `src/data/services.ts`                                                                                       |
| Hero copy + Carlsbad tagline           | `src/features/home/useHomeData.ts` (`FALLBACK_HERO.tagline`) — Core API can override per `ApiHero`           |
| Global `<title>` / meta / OG / Twitter | `index.html` `<head>` (static, ships to every CSR route)                                                     |
| BeautySalon JSON-LD                    | `index.html` `<script type="application/ld+json">` — single canonical block, **do not duplicate at runtime** |
| Social-share image (1200×630)          | `public/og-image.jpg` (binary)                                                                               |
| OG-image source candidates             | `design/og-candidates/` (PNG originals + `README.md` ranking notes)                                          |
| Robots / sitemap                       | `public/robots.txt`, `public/sitemap.xml`                                                                    |
| Founders' Rate ribbon                  | `src/components/FoundersRibbon.tsx` (mounted in `src/router.tsx` `RootLayout`)                               |

The JSON-LD `address`, `telephone`, and `openingHoursSpecification` fields **must
match** `src/data/contact.ts`. There is currently no build-time generator —
re-edit by hand and keep both in sync.

### Per-route metadata

The current pass ships **global-only** OG/Twitter/canonical tags from `index.html`.
For per-route overrides (e.g. `/services/<slug>`, `/about`), use the
`setRouteMeta()` helper in `src/app/seo.ts` from a `useEffect` in the route
component:

```tsx
import { setRouteMeta } from '@app/seo';
import { useEffect } from 'react';

export default function NanoNeedling() {
  useEffect(() => {
    setRouteMeta({
      title: 'Nano-needling — Mukyala',
      description: 'Cosmetic-depth nano-needling by a licensed esthetician...',
      canonical: 'https://www.mukyala.com/services/nano-needling',
      ogImage: 'https://www.mukyala.com/og-image.jpg',
    });
  }, []);
  return null;
}
```

`setRouteMeta` is idempotent and only touches the keys you pass — partial input
will not clobber tags it didn't receive. Outside the browser (SSG / Node) it is
a no-op.

### Updating the social-share OG image

`public/og-image.jpg` is a derived artifact. Re-derive it via the script wired
under `npm run og:generate` (see `scripts/generate-og-image.mjs`):

```bash
# Default — re-encode the operator-approved photo at design/og-candidates/01-winner-clean-editorial.png
npm run og:generate

# Regenerate the typographic-bridge fallback (cream card + wordmark + tagline)
npm run og:generate -- --bridge

# Use an arbitrary source PNG/JPEG
npm run og:generate -- --source path/to/source.png

# Tighten the JPEG quality budget if needed (auto-steps 85 → 80 → 75; throws below 75)
npm run og:generate -- --quality 80
```

The script enforces a 300 KB budget; if it can't hit that at quality ≥ 75 it
throws. See `design/og-candidates/README.md` for the candidate lineage and
ranking that picked the current shipped image.

### Founders' Rate ribbon

The dismissible top-of-page ribbon ("Founders' Rate — Signature Facial $129 ·
First 50 guests") lives in `src/components/FoundersRibbon.tsx` and is mounted
sitewide in `src/router.tsx` `RootLayout` above `<Header />`.

- **Copy / CTA / link target**: edit constants at the top of `FoundersRibbon.tsx`
  (`RIBBON_COPY`, `CTA_HREF`, `CTA_LABEL`).
- **Retire the promo** (e.g. once the first 50 guests are booked): unmount
  `<FoundersRibbon />` from `RootLayout`, or gate it behind a feature flag.
  Do not silently swap copy on the same `localStorage` key — see next bullet.
- **Re-enable for previously-dismissed users**: bump the storage key version
  suffix (`mukyala.foundersRibbonDismissed.v1` → `.v2`) in
  `FOUNDERS_RIBBON_STORAGE_KEY`. That resets the dismissal cohort so the new
  promo is shown to everyone, including users who dismissed the old one.

### Tracking & Consent

Analytics, ads measurement, and the CCPA cookie banner ship as part of chunk
`spa-tracking-and-consent-2026-05-09`. The wiring is **opt-in via env vars** —
when the env vars are unset, zero third-party scripts load and `window.dataLayer`
is undefined, even in dev. That's the design.

#### Operator quickstart (TL;DR)

Seven steps to start collecting data on a fresh deploy. Detailed sub-sections
follow.

1. Create a GTM container at [tagmanager.google.com](https://tagmanager.google.com/)
   → grab the `GTM-XXXXXXX` ID.
2. Inside the GTM workspace, create a **GA4 Configuration** tag using a GA4
   Measurement ID (`G-XXXXXXXXXX`) you create at
   [analytics.google.com](https://analytics.google.com/).
3. Inside the GTM workspace, create a **Meta Pixel** tag (Custom HTML or via
   the Facebook Pixel community template) using the pixel ID from your Meta
   Business Suite.
4. Set up triggers in GTM: **All Pages** plus the three custom events the SPA
   emits — `view_content`, `lead`, `schedule`.
5. Pick an email service provider (Klaviyo or Mailchimp recommended) and grab
   the embedded form action URL or `/post-json` endpoint.
6. In your hosting provider (Netlify / Vercel / Cloudflare Pages), set:
   - `VITE_GTM_ID=GTM-XXXXXXX`
   - `VITE_NEWSLETTER_ENDPOINT=https://...`
7. Trigger a redeploy. Verify in DevTools → Network that GTM loads, and that
   `window.dataLayer` is populated.

#### Files

| Concern                              | Canonical source                                           |
| ------------------------------------ | ---------------------------------------------------------- |
| GTM container injection (build-time) | `scripts/vite-plugin-gtm.mjs`                              |
| Consent Mode v2 + storage helpers    | `src/app/consent.ts`                                       |
| dataLayer wrapper + event constants  | `src/app/analytics.ts` (see `EV`)                          |
| Cookie banner UI                     | `src/components/CookieBanner.tsx`                          |
| Newsletter signup form               | `src/components/NewsletterSignup.tsx`                      |
| CCPA "Do Not Sell or Share" link     | `src/components/Footer.tsx`                                |
| Privacy policy (CCPA template)       | `src/pages/PrivacyPolicy.tsx`                              |
| Env var examples                     | `.env.example` (`VITE_GTM_ID`, `VITE_NEWSLETTER_ENDPOINT`) |

#### Get a GTM container ID

1. Sign in at [tagmanager.google.com](https://tagmanager.google.com/) and
   create a new container of type "Web".
2. Copy the container ID (format `GTM-XXXXXXX`) and set it as `VITE_GTM_ID` in
   your `.env.local` (dev) or hosting env (prod). The plugin validates the
   shape against `/^GTM-[A-Z0-9]+$/` and skips injection (with a build warning)
   on a malformed value.

#### Configure GA4 + Meta Pixel inside GTM

GA4 and the Meta Pixel are configured **inside the GTM workspace**, not in
SPA env vars. The SPA only emits events; GTM tags translate them into GA4
hits and Pixel events.

- GA4 setup: [Set up the GA4 configuration tag](https://support.google.com/tagmanager/answer/9442095).
- Meta Pixel via GTM: [Install the Meta Pixel using Google Tag Manager](https://www.facebook.com/business/help/1021909254506499).

The events the SPA emits are listed in `src/app/analytics.ts` (`EV` constants):

| Event              | Where it fires                                            | Use for           |
| ------------------ | --------------------------------------------------------- | ----------------- |
| `view_content`     | `/services` (index) and `/services/<slug>` (per-card)     | Pixel ViewContent |
| `lead`             | NewsletterSignup success                                  | Pixel Lead        |
| `schedule`         | Hero CTA, FoundersRibbon CTA, ServiceDetail "Book" button | Pixel Schedule    |
| `consent_granted`  | CookieBanner "Accept" click                               | Custom (audit)    |
| `consent_declined` | CookieBanner "No thanks" click                            | Custom (audit)    |

Event payload shapes (pushed onto `window.dataLayer` by `trackEvent` /
`trackViewContent` / `trackLead` / `trackScheduleIntent` in `src/app/analytics.ts`):

```text
// view_content — Services index card click + ServiceDetail mount
{ event: 'view_content', content_name, content_category?, value, currency: 'USD' }

// lead — NewsletterSignup successful submit
{ event: 'lead', content_name: source, source, value: 0, currency: 'USD' }
// `source` = location.pathname at submit time (e.g. "/about").

// schedule — Hero CTA, FoundersRibbon CTA, ServiceDetail "Book" click
{ event: 'schedule', cta_id, content_name?: serviceSlug, service?: serviceSlug,
  source, value: 0, currency: 'USD' }

// consent_granted / consent_declined — CookieBanner Accept / No thanks click
{ event: 'consent_granted' | 'consent_declined', source: 'cookie_banner' }
```

#### Wire the newsletter endpoint

`NewsletterSignup` POSTs `{ email, source }` to `VITE_NEWSLETTER_ENDPOINT`.
Two common backends:

- **Klaviyo embedded form**: copy the form action URL from the embedded form
  installation snippet (looks like `https://manage.kmail-lists.com/subscriptions/subscribe`).
- **Mailchimp post-json**: copy the form action and append `&c=?` for JSONP, or
  proxy via a serverless function that forwards `{ email }` to Mailchimp's
  `/lists/{list_id}/members` API.

When unset, the form renders, validates, and shows the success state without
POSTing anywhere — useful for QA before wiring a backend. In `import.meta.env.DEV`
a single `console.warn` is emitted to remind you that no real submission
happened.

#### CCPA vs GDPR consent posture

We use **CCPA opt-out** by default (the user is in California; analytics
storage starts granted, ad storage starts denied). The cookie banner is
courtesy + lets users tighten further or re-open via the footer
"Do Not Sell or Share My Personal Information" link. If we ever expand to
the EU, switch the default state in `consent.ts#setConsentDefault` to
`analytics_storage: 'denied'` and require an opt-in click.

The default state is wired in **two places** so it stays consistent across
build-time injection and SPA-side defensive use:

1. `scripts/vite-plugin-gtm.mjs` emits an inline `<script>` at the top of
   `<head>` that calls `gtag('consent', 'default', {...})` BEFORE the gtm.js
   loader runs. This is what GTM sees first.
2. `src/app/consent.ts#setConsentDefault()` mirrors that same payload as a
   runtime helper.

#### localStorage key contract

The user's choice is persisted under a versioned key:

| Key                        | Values                              |
| -------------------------- | ----------------------------------- |
| `mukyala.consentChoice.v1` | `"accepted"` / `"declined"` / unset |

Absence of the key means "no choice yet" — the banner will auto-show on the
next visit. **Bump the version suffix (`.v1` → `.v2`) only when consent
semantics change in a way that warrants asking already-decided users again**
(e.g. you add a third storage bucket, or you flip from CCPA opt-out to GDPR
opt-in). Renaming alone (without a semantic change) is needless friction.

#### No-op safety (env vars unset)

When `VITE_GTM_ID` is unset (or empty), the Vite plugin
(`scripts/vite-plugin-gtm.mjs`) emits **zero** GTM markup into `index.html` —
no consent-default `<script>`, no gtm.js loader, no `<noscript>` iframe.
That means:

- No requests to `googletagmanager.com` ever fire.
- `window.dataLayer` is `undefined`.
- `trackEvent` / `trackViewContent` / `trackLead` / `trackScheduleIntent`
  are silent no-ops (they early-return when `dataLayer` isn't an array).
- `consent.ts` helpers (`setConsentDefault`, `acceptAll`, `declineAll`,
  `applyPersistedConsent`) push nothing — only the localStorage write
  happens, which is harmless.

Same story for `VITE_NEWSLETTER_ENDPOINT`: when unset, the form renders and
validates, the success state shows, and `trackLead` still fires onto
dataLayer (which itself is a no-op when GTM isn't loaded). No POST goes out.

This is what makes the build safe to run in CI / offline / local dev with no
configuration at all.

#### Test consent locally

```bash
# 1. Set a real-shaped (but throwaway) GTM ID — match the regex.
VITE_GTM_ID=GTM-TEST123 npm run dev

# 2. Open the site, then DevTools → Application → Local Storage. The key
#    `mukyala.consentChoice.v1` is empty on first visit; click Accept or
#    Decline and watch the value appear ("accepted" or "declined").

# 3. DevTools → Console: window.dataLayer
#    You should see consent default + (after a click) consent update entries
#    pushed as arguments-arrays.

# 4. Unset the env var and reload — confirm no googletagmanager.com requests
#    in the Network panel and window.dataLayer is undefined.
```

The e2e suite covers all of the above in `e2e/spa-tracking-and-consent.spec.ts`.

---

## 🚀 Getting Started

```bash
# Install deps
npm install

# Start dev server
npm run dev

# Lint
npm run lint

# Production build
npm run build
```

### 1. Prerequisites

- **Node.js ≥ 20** (the repo uses the new-stream ESM loader that ships with Node 20).  
  Use [`nvm`](https://github.com/nvm-sh/nvm) or asdf to install the correct version.
- **pnpm / yarn** will also work, but the scripts below assume `npm`.

### 2. First-time bootstrap (local dev)

```bash
# 1. Clone the repo
git clone git@github.com:deograstius/mukyala-the-spa.git
cd mukyala-the-spa

# 2. Install dependencies (≈ 30 s)
npm install

# 3. Start Vite in dev-mode – opens http://localhost:5173
npm run dev

# 4. (Optional) Type-check & lint in watch-mode in a second terminal
npm run typecheck -- --watch
npm run lint -- --watch
```

Vite will hot-reload changes to **TS/TSX, CSS, images and Markdown** in the browser instantly.

Features that POST or GET against `/v1/*` (the consultation wizard's
`POST /v1/consultations`, services, home hydration, notification preferences,
etc.) require the local `mukyala-core-api` to be running. The Vite dev
server proxies `/v1/*` to it; see the next subsection for the two-terminal
startup.

### 2a. Local API for `/v1/*` endpoints (dev only)

The SPA's data layer (`src/utils/api.ts`) builds origin-relative URLs like
`/v1/consultations` when no `VITE_API_BASE_URL` is set, which is the intended
behavior in production (same-origin via the ALB). In local dev the Vite server
on `:5173` does not implement `/v1`, so a Vite dev proxy forwards `/v1/*` to
the local `mukyala-core-api` (`:4000`). The proxy is configured under
`server.proxy` in `vite.config.ts` and is dev-only — `vite build`/`vite preview`
ignore it, so production/staging builds (which use absolute `VITE_API_BASE_URL`)
are unaffected.

Two-terminal startup:

```bash
# Terminal 1 — start the API (mukyala-core-api repo)
cd ../mukyala-core-api
cp .env.example .env   # first time only; set DATABASE_URL etc.
npm install            # first time only
npm run db:migrate
npm run dev            # listens on http://localhost:4000

# Terminal 2 — start the SPA (this repo)
npm run dev            # http://localhost:5173, proxies /v1/* → :4000
```

Notes:

- If the API is not running, every `/v1/*` request 404s through the proxy
  (the consultation submit was the canonical failure mode this fixes).
- To point the SPA at a non-local API instead of the proxy, set
  `VITE_API_BASE_URL` before `npm run dev` (for example
  `VITE_API_BASE_URL=https://api.staging.mukyala.com npm run dev`); the
  resolver in `src/app/config.ts` will use the absolute URL and the proxy
  rule becomes a no-op.
- The proxy currently covers `/v1` only. Telemetry/collector endpoints and
  non-`/v1` services are not proxied; add sibling `server.proxy` entries when
  those become a local-dev concern.

### 3. Production build & preview

```bash
# Type-check and build an optimized client bundle in dist/
npm run build

# Serve the production build locally
npm run preview
```

The resulting `dist/` folder is a fully-static site that can be hosted on any CDN (Vercel, Netlify, S3, Cloudflare Pages, etc.).

### 3.1 Compliance prerender routes (Twilio/curl visibility)

To support Twilio and carrier website verification checks, build-time prerendering is enabled for:

- `/privacy`
- `/terms`
- `/sms-disclosures`
- `/reservation`

Route configuration lives in `vite.config.ts` under `vitePrerenderPlugin(...).additionalPrerenderRoutes`.
The prerender entry point is `src/prerender.tsx`.

Local verification:

```bash
# Build static output (includes prerendered compliance routes)
npm run build

# Serve dist/ on localhost:5173
npm run preview -- --host localhost --port 5173 --strictPort

# In another terminal, verify raw HTML contains compliance text
curl -sS http://localhost:5173/privacy | rg -n "SMS/Mobile Messaging Privacy|text messaging originator opt-in data and consent"
curl -sS http://localhost:5173/terms | rg -n "STOP|HELP|Message and data rates may apply|Message frequency varies|Carriers are not liable"
curl -sS http://localhost:5173/sms-disclosures | head -n 40
curl -sS http://localhost:5173/reservation | rg -n "760\\) 276-6583|STOP|HELP|Message and data rates may apply|Message frequency varies|Carriers are not liable"
```

### 4. Container build & deploy (staging/prod)

This repo includes a multi-stage Dockerfile and a GitHub Actions workflow to build and deploy the frontend as an ECS service behind an ALB.

- Dockerfile builds the Vite app and serves it via nginx with SPA fallback and `/health` endpoint.
- Workflow: `.github/workflows/deploy.yml`
  - On `push` to `main`, target stays `staging` in `us-west-2` (unchanged).
  - Manual runs support `workflow_dispatch` input `target` (`staging` or `prod`; default `staging`).
  - Required GitHub configuration for prod: repository variable `AWS_PROD_ROLE_ARN` (prod role ARN).
  - For `target=prod`, the workflow uses:
    - ECR `284148174223.dkr.ecr.us-west-1.amazonaws.com/mukyala/frontend`
    - ECS names `frontend-prod`
    - `VITE_API_BASE_URL=https://api.mukyala.com`
  - For `target=staging`, it uses:
    - ECR `284148174223.dkr.ecr.us-west-2.amazonaws.com/mukyala/frontend`
    - ECS names `frontend`
    - `VITE_API_BASE_URL=https://api.staging.mukyala.com`
  - Image tag is always `${GITHUB_SHA}` (no `:latest`).
  - Workflow fails fast on prod runs when `AWS_PROD_ROLE_ARN` is missing.
  - Deployment registers a new ECS task definition pinned to that image, then rolls out ECS with `aws ecs update-service --task-definition <new-arn>`.

Manual trigger

- Push to `main`, or run the workflow from the Actions tab.

Verify

- `https://staging.mukyala.com/` should return 200 and serve the app.
- `https://staging.mukyala.com/health` returns `{ "status": "ok" }`.

### Folder overview

```
src/
  app/                   App-level helpers (SEO)
  components/            Layout + UI (Header, Footer, MobileNav, cart)
    sections/            Home page sections (Hero, ServicesGrid, FeaturedProducts, …)
  features/              Domain components (home, shop, services, cart-drawer)
  pages/                 Route entries (see “Routes” below)
  contexts/              React context providers (CartContext)
  styles/                App CSS overrides (imports Webflow CSS)
  test/                  Vitest setup + helpers
  types/                 Shared types and ambient declarations
  router.tsx             TanStack Router config
  main.tsx               App bootstrap

public/
  css/                   Webflow CSS (normalize.css, webflow.css, mukyala-2.webflow.css)
  fonts/                 Font files referenced by Webflow CSS
  images/                Marketing images and icons used by pages/sections
  vite.svg               Favicon + social preview icon

e2e/                     Playwright tests
```

Path aliases are configured for imports: `@app`, `@shared`, `@features`, `@entities`, `@pages`, `@contexts`, `@hooks`, `@utils`, `@data`, `@types`.

### Routes

Current routes implemented in `src/router.tsx`:

- `/` → Home
- `/about` → About
- `/services` → Services
- `/services/:slug` → Service detail (data loaded from `/v1/services`, 404s when not found)
- `/shop` → Shop
- `/shop/:slug` → Product detail (data loaded from `src/data/products.ts`, 404s when not found)
- `/checkout` → Checkout
- `/checkout/success?orderId=` → Checkout confirmation (rehydrates cached cart data and pings the Orders confirmation endpoint when a token is available)
- `/checkout/cancel?orderId=` → Checkout cancel / incomplete order
- `/reservation` → Reservation
- `/consultation` → Consultation wizard (Form 1 / `intake`); 6-step async skin-consultation intake that submits to `POST /v1/consultations`. Drafts persist to `localStorage` under `mukyala.forms.draft.intake.<client_session_id>` with a 30-day TTL and a resume prompt on mount; on a 200 response the success panel surfaces the returned `submission_id`. Step 1 is the default landing screen.
- `/consultation/:step` → Consultation step (`step-1`..`step-6`); deep-linkable per-step routes, invalid values fall through to `step-1`. The success state renders in-place inside the page after a 200 response (no separate `/success` URL).
- `/privacy` → Privacy Policy
- `/terms` → Terms of Service
- `/refunds` → Refunds & Returns policy
- `/shipping` → Shipping / Fulfillment policy
- `/sms-disclosures` → SMS Program Disclosures
- `/notifications/manage` → Manage notifications (email-link token, email DOI confirm token, and reservation-id + cancel-code flows)
- `*` → 404 Not Found

Footer support contact is rendered site-wide via `RootLayout` and exposes explicit address, phone, and email actions (maps/tel/mailto links).
The `/terms` Communications section includes SMS-specific disclosures (`STOP`/`HELP`, frequency, rates, support contact, carrier non-liability) and links to policy terms.
Waitlist SMS CTAs in Reservation, Checkout sold-out alerts, and the Cart drawer sold-out alert include inline disclosure text with `STOP`/`HELP`, frequency/rates, support contact, carrier non-liability, and links to `/sms-disclosures`, `/terms`, and `/privacy`.
Marketing email capture is intentionally not live on Reservation/Checkout waitlist surfaces; those pages show explicit fallback copy and route users to `/notifications/manage`.

### Manage notifications flow

- Entry path 1 (email link): users submit an email to `POST /v1/notification-preferences/email-link`, then open `/notifications/manage?token=...`.
- Entry path 1b (email DOI confirmation): users open `/notifications/manage?confirmEmailToken=...`, which calls `POST /v1/notification-preferences/marketing-email/confirm`.
- Entry path 2 (cancel code): users submit reservation ID + 6-digit code to `POST /v1/notification-preferences/cancel-code/session`.
- Session hydration/update: the page reads `GET /v1/notification-preferences/session?token=...` and saves updates via `PATCH /v1/notification-preferences/session` (including displayed consent text + version metadata when marketing toggles are changed).
- Marketing SMS toggle behavior: enabling SMS from Manage Notifications saves as `pending` DOI first (toggle remains off after save) until the user replies `YES`/`START` to the confirmation SMS.
- One-click unsubscribe: `/notifications/manage?token=...&unsubscribe=1` calls `POST /v1/notification-preferences/unsubscribe`.
- Transactional reservation updates remain enabled; only marketing email/SMS preferences are mutable.
- Compliance status is shown in-page for DOI state (`pending`/`confirmed`/`not subscribed`) and update timing (`appliedWithinOneBusinessDay`); pending SMS saves show explicit `Reply YES` guidance.

### Consultation (Form 1 / `intake`)

- Entry points: home hero CTA "Consultation" (sits next to "Reservation"); deep links `/consultation` or `/consultation/step-N`.
- 6 steps: Personal, Lifestyle, Skin Concerns, Health, Females-only (skip-able), Review & Sign.
- Draft persistence: `localStorage` under `mukyala.forms.draft.intake.<client_session_id>`, 30-day TTL, debounced autosave, resume prompt on remount.
- Submission: `POST /v1/consultations` with optional `Idempotency-Key`; success swaps the shell for `SuccessPanel` showing the returned `submission_id`. No separate success URL.
- Source of truth for fields, required-set, copy, and submission contract: `mukyala-client-forms-MASTER.md` (kept outside this repo). Do not duplicate field lists here — link to the master MD instead.
- Home hero: only the subheadline "Timeless rituals, inclusive care." remains; the previous `<h1>` headline was removed in this release.

### Reservation (Simplified)

- Fields: Name, Phone, optional Email, Service, Date/Time.
- Date/Time is interpreted and validated in Pacific Time (PT) with opening hours 9:00–19:00.
- Phone input accepts digits and formats as you type; normalized digits are saved for processing.
- On submit, a success message is shown and the last request is stored locally for convenience.

Next Steps

- Availability lookup and staff notifications.
- Guest confirmations by SMS/email.
- Backend API for creating and managing reservations.

Conventions

- Co-locate tests next to components/pages in `__tests__` folders.
- Use `public/images/...` for runtime-served assets referenced via string paths.
- For TS imports of images/SVGs, add module declarations in `src/types/static.d.ts`.
- Prefer named, semantic component files over generic `index.tsx` to ease searchability.

### Add a new page

1. Create the page component under `src/pages/`:

```tsx
// src/pages/Services.tsx
export default function Services() {
  return (
    <main className="section">
      <div className="w-layout-blockcontainer container-default w-container">
        <h1 className="display-9">Services</h1>
        <p className="paragraph-large">Coming soon.</p>
      </div>
    </main>
  );
}
```

2. Register the route in `src/router.tsx`:

```tsx
import Services from './pages/Services';

const ServicesRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'services',
  component: Services,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routeTree = RootRoute.addChildren([
  IndexRoute,
  AboutRoute,
  ServicesRoute,
  // ...other routes
]);
```

### Design tokens and utilities

- Tokens and utilities live in `src/shared/styles/tokens.css` (colors, spacing, radii, z-index, helpers).
- Prefer utilities over ad‑hoc CSS where possible.
  - Use `.aspect-square` for 1:1 media wrappers to keep card tiles uniform.
- Prefer shared primitives over raw markup:
  - Layout: `Section`, `Container`, `Grid`
  - Structure: `List`, `ListItem`
  - Media/UI: `ResponsiveImage`, `Button`, `ButtonLink`, `MediaCard`

See docs/COMPONENTS.md for a quick reference of shared components, a11y helpers, and form primitives.

### Currency handling

- Compute with numbers; render with `Price` (uses `utils/currency`).
- Avoid mixing formatted price strings in arithmetic or state.

### Testing & typechecking

- Unit tests: Vitest configured via `vite.config.ts` (`test` key) with JSDOM environment and `@testing-library/jest-dom/vitest`.
- E2E tests: Playwright in `e2e/` with `playwright.config.ts`.
  - Linting: ESLint Flat Config (`eslint.config.js`) with a test override enabling Vitest globals.
  - Typechecking:
    - App/Node: `npm run typecheck` (tsc, no emit)
    - Tests: `npm run typecheck:test` (uses `tsconfig.test.json` with `vitest/globals` + jest-dom types)

To run E2E locally, start a local server first (recommended: production preview for CI parity), then run Playwright in a second terminal:

```bash
npm run build
npm run preview -- --port 5173
# in a second terminal
npm run test:e2e
```

The Playwright config uses `baseURL: http://localhost:5173` and does not auto-start a web server.
For `e2e/staging-api-host-cors.todo.spec.ts`, expected API host behavior is env-aware:

- Leave `E2E_EXPECT_API_BASE_URL` unset for CI-like local preview runs (the spec expects same-origin API requests against the preview host).
- Set `E2E_EXPECT_API_BASE_URL` when validating a build configured with a fixed API host (for example `VITE_API_BASE_URL=https://api.staging.mukyala.com`).

Configured-host verification example:

```bash
VITE_API_BASE_URL=https://api.staging.mukyala.com npm run build
npm run preview -- --port 5173
# in a second terminal
E2E_EXPECT_API_BASE_URL=https://api.staging.mukyala.com npm run test:e2e -- e2e/staging-api-host-cors.todo.spec.ts
```

Policy/support-contact/SMS-disclosures coverage includes `e2e/privacy.spec.ts`, `e2e/refunds.spec.ts`, `e2e/shipping.spec.ts`, `e2e/support-contact.spec.ts`, `e2e/sms-disclosures.spec.ts`, and `e2e/waitlist-sms-disclosures-inline.spec.ts` (including inline disclosure styling guards).
Run targeted policy/footer specs with:

```bash
npm run test:e2e -- e2e/support-contact.spec.ts
npm run test:e2e -- e2e/sms-disclosures.spec.ts
npm run test:e2e -- e2e/waitlist-sms-disclosures-inline.spec.ts
npm run test:e2e -- e2e/privacy.spec.ts
```

Manage-notifications targeted checks:

```bash
npm test -- --run src/pages/__tests__/ManageNotifications.test.tsx src/features/notifications/managePreferencesApi.test.ts
npm test -- --run src/features/notifications/compliance.todo.test.ts
npm run test:e2e -- e2e/manage-notifications.spec.ts
npm run test:e2e -- e2e/manage-notifications-compliance.todo.spec.ts
npm test -- --run src/app/deploy-posture.todo.test.ts
```

---

## 🛣️ Roadmap

### Unit test coverage

- Vitest is configured with coverage thresholds (lines/statements/functions/branches ≥ 80%).
- Run `npm test -- --coverage` to generate coverage reports (text + HTML + lcov).

### CI

- GitHub Actions runs on push/PR to `main`.
- Jobs: lint, typecheck, unit (with coverage + JUnit), and E2E (Playwright with JUnit, HTML report, traces/videos).
- Reproduce locally:
  - Lint/format: `npm run format:check && npm run lint`
  - Typecheck: `npm run typecheck && npm run typecheck:test`
- Unit: `npm test -- --coverage --run`
- E2E (local preview): `npm run build && npm run preview & npx wait-on http://localhost:5173 && npm run test:e2e`

#### API mocking (MSW)

- Unit/integration tests use Mock Service Worker (MSW) to stub Core API endpoints.
- Server is configured in `src/test/msw.server.ts` and started in `src/test/setup.tsx`.
- Default handlers cover `/v1/services`, `/v1/products`, `/v1/locations`, and `POST /v1/reservations`.
- Tests can override handlers with `server.use(...)` when needed.

#### Check CI status via CLI

- List latest runs: `gh run list -R deograstius/mukyala-the-spa --limit 5`
- Inspect a run: `gh run view <run-id> -R deograstius/mukyala-the-spa --json status,conclusion`
- Filter by workflow: `gh run list -R deograstius/mukyala-the-spa --workflow "Frontend CI"`
- PR checks (if using PRs): `gh pr checks <pr-number> -R deograstius/mukyala-the-spa`

### API base URL

- Resolution order:
  1. `VITE_API_BASE_URL` when set to a valid absolute URL.
  2. Hostname default:
     - `staging.mukyala.com` (and subdomains) -> `https://api.staging.mukyala.com`
     - `www.mukyala.com` or `mukyala.com` -> `https://api.mukyala.com`
  3. `undefined` for localhost/unknown hosts (the app then uses relative requests).
- Staging deploys set `VITE_API_BASE_URL=https://api.staging.mukyala.com` at image build time in `.github/workflows/deploy.yml`.
- For local dev, the default workflow uses the Vite `/v1` dev proxy to a local `mukyala-core-api` (see "2a. Local API for `/v1/*` endpoints (dev only)" above) — no env var required. Set `VITE_API_BASE_URL` (for example `http://localhost:4000` or a remote staging URL) only when bypassing the proxy.

High-level milestones (see `TODO.md` for granular tasks):

1. Asset + global-style import (Phase 0) ✔️
2. Layout shell: Header & Footer 🛠️ (in progress)
3. Home-page sections converted to JSX (Hero → CTA)
4. Routing + page scaffolds
5. Replace Webflow interactions with Framer Motion
6. Extract UI primitives & clean unused CSS
7. Wire up React Query + real booking & product APIs

Known placeholders:

- The “Make a Reservation” CTA in the Services grid links to `/reservation`, which is not implemented yet.
- Blog/Contact/Pricing render stub pages that say “This page is coming soon.”

---

## 📜 License

Apache-2.0 – see `LICENSE` for details.
