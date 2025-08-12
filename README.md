# Mukyala Day Spa – Web Application

Welcome to the codebase for **Mukyala Day Spa**, a modern React + Vite application that delivers the spa’s timeless luxury and old-school customer service in a digital experience.

---

## 🧭 Project Purpose

The goal of this repository is to rebuild the exported Webflow marketing site as clean, maintainable React components while adding true application features such as routing, booking, commerce, and AI-powered recommendations.

## 🛠 Tech Stack

The project is built on a modern, **strict-typed** React tool-chain that boots up in milliseconds and provides instant HMR (hot-module reload) while you code.

| Layer                   | Library / Tool                | Notes                                                                                |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| Build & Dev Server      | **Vite 7**                    | ESBuild-powered, <50 ms cold-start, React Fast-Refresh baked-in                      |
| UI                      | **React 19**                  | Using the new canary runtime & concurrent features                                   |
| Language                | **TypeScript 5**              | `strict`, `moduleResolution: "bundler"`, zero-emit – the bundler handles compilation |
| Routing                 | **@tanstack/react-router v1** | File-agnostic, type-safe routes with first-class loader & search-param support       |
| Data Fetching / Caching | **@tanstack/react-query v5**  | Query & mutation caching, optimistic updates                                         |
| Animations              | **Framer-Motion v12**         | Spring physics, variants & scroll triggers                                           |
| Linting                 | **ESLint 9** flat-config      | `@typescript-eslint`, `react-hooks`, `jsx-a11y`, `import`, `prettier`                |
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

### Folder overview

```
src/
  components/            Reusable UI pieces (Header, Footer, Dropdown, …)
    sections/            Home page sections (Hero, ServicesGrid, FeaturedProducts, …)
  pages/                 Route entry components (Home, About, NotFound)
  styles/                App-specific CSS overrides (imports Webflow CSS)
  test/                  Vitest setup + helpers
  types/                 Global ambient types (e.g., static asset modules)
  router.tsx             TanStack Router config
  main.tsx               App bootstrap

public/
  css/                   Webflow CSS (normalize.css, webflow.css, mukyala-2.webflow.css)
  fonts/                 Font files referenced by Webflow CSS
  images/                Marketing images and icons used by pages/sections
  vite.svg               Favicon + social preview icon

e2e/                     Playwright tests
TODO.md                  Detailed migration checklist
```

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

const routeTree = RootRoute.addChildren([
  IndexRoute,
  AboutRoute,
  ServicesRoute,
  // ...other routes
]);
```

### Testing & typechecking

- Unit tests: Vitest configured via `vite.config.ts` (`test` key) with JSDOM environment and `@testing-library/jest-dom/vitest`.
- E2E tests: Playwright in `e2e/` with `playwright.config.ts`.
- Linting: ESLint Flat Config (`eslint.config.js`) with a test override enabling Vitest globals.
- Typechecking:
  - App/Node: `npm run typecheck` (tsc, no emit)
  - Tests: `npm run typecheck:test` (uses `tsconfig.test.json` with `vitest/globals` + jest-dom types)

---

## 🛣️ Roadmap

The step-by-step migration plan lives in **TODO.md**. High-level milestones:

1. Asset + global-style import (Phase 0) ✔️
2. Layout shell: Header & Footer 🛠️
3. Home-page sections converted to JSX (Hero → CTA)
4. Routing + page scaffolds
5. Replace Webflow interactions with Framer-Motion
6. Extract UI primitives & clean unused CSS
7. Connect real booking & product APIs

---

## 📜 License

Apache-2.0 – see `LICENSE` for details.
