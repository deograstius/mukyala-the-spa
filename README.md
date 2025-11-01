# Mukyala Day Spa – Web Application

[![Frontend CI](https://github.com/deograstius/mukyala-the-spa/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/deograstius/mukyala-the-spa/actions/workflows/ci.yml)

Welcome to the codebase for **Mukyala Day Spa**, a modern React + Vite application that delivers the spa’s timeless luxury and old-school customer service in a digital experience.

---

## 🧭 Project Purpose

The goal of this repository is to rebuild the exported Webflow marketing site as clean, maintainable React components while adding true application features such as routing, booking, commerce, and AI-powered recommendations.

## 🛠 Tech Stack

The project is built on a modern, **strict-typed** React tool-chain that boots up in milliseconds and provides instant HMR (hot-module reload) while you code.

| Layer                   | Library / Tool                | Notes                                                                                |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| Build & Dev Server      | **Vite 7**                    | ESBuild-powered, <50 ms cold-start, React Fast-Refresh baked-in                      |
| UI                      | **React 19**                  | Concurrent features-ready                                                            |
| Language                | **TypeScript 5**              | `strict`, `moduleResolution: "bundler"`, zero-emit – the bundler handles compilation |
| Routing                 | **@tanstack/react-router v1** | Type-safe routes with first-class loaders and `notFound()` handling                  |
| Data Fetching / Caching | **@tanstack/react-query v5**  | Present in deps; not wired yet (no QueryClientProvider in app)                       |
| Animations              | **Framer Motion v12**         | Present in deps; not used yet in code                                                |
| Linting                 | **ESLint 9** flat-config      | `typescript-eslint`, `react-hooks`, `jsx-a11y`, `import`, `prettier`                 |
| Formatting              | **Prettier 3**                | Runs automatically on staged files via **lint-staged**                               |
| Git Hooks               | **simple-git-hooks**          | Zero-dependency replacement for Husky                                                |

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

### 3. Production build & preview

```bash
# Type-check and build an optimized client bundle in dist/
npm run build

# Serve the production build locally
npm run preview
```

The resulting `dist/` folder is a fully-static site that can be hosted on any CDN (Vercel, Netlify, S3, Cloudflare Pages, etc.).

### 4. Container build & deploy (staging)

This repo includes a multi-stage Dockerfile and a GitHub Actions workflow to build and deploy the frontend as an ECS service behind an ALB in `us-west-2`.

- Dockerfile builds the Vite app and serves it via nginx with SPA fallback and `/health` endpoint.
- Workflow: `.github/workflows/deploy.yml`
  - Assumes AWS OIDC role `arn:aws:iam::284148174223:role/mukyala-staging-gha-oidc`
  - Builds `284148174223.dkr.ecr.us-west-2.amazonaws.com/mukyala/frontend:latest`
  - Pushes to ECR and forces an ECS service rollout (`frontend` cluster/service)

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
  pages/                 Route entries (Home, About, Services, Shop, ProductDetail, Checkout, NotFound)
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
- `/shop` → Shop
- `/shop/:slug` → Product detail (data loaded from `src/data/products.ts`, 404s when not found)
- `/checkout` → Checkout
- `*` → 404 Not Found

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

To run E2E locally, start the dev server in one terminal and then run Playwright in another:

```bash
npm run dev
# in a second terminal
npm run test:e2e
```

The Playwright config uses `baseURL: http://localhost:5173` and does not auto-start a web server.

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

- Configure `VITE_API_BASE_URL` (e.g., `http://localhost:4000`) for API requests.
- The app reads it via a typed config helper; invalid/missing values disable API calls.

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
