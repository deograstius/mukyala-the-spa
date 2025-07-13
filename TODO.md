# Mukyala Day Spa – React-Migration TODO

Goal: reproduce **home-v1** from the exported Webflow template as a fully-hand-written JSX page inside the Vite + React project – no dangerous `dangerouslySetInnerHTML` dumps.

This checklist is evidence-driven: every asset/component reference below is taken directly from `../mukyala/home-pages/home-v1.html` and its related CSS.

---

## 0 · Set-up

_Create once before converting any section._

- [ ] **Global style import**  
       Copy the following into `src/styles/global.css` and import it in `main.tsx`:
      `css/normalize.css`, `css/webflow.css`, `css/mukyala-2.webflow.css`

- [ ] **Fonts**  
       Copy webfont files referenced by Webflow CSS → `public/fonts/`
      • `fonts/line-rounded-icon-font-brix.woff` (icons)  
       • `fonts/social-media-icon-font-brix.woff` (social icons)  
       • `fonts/Switzer-*.woff` (text family)  
       • `fonts/fontello.woff` (misc icons)

- [ ] **Shared assets**  
       Initial list needed for header/footer:  
       • `images/logo-web-hair-x-webflow-template.svg`  
       • `images/instagram-icon-white-hair-x-webflow-template.svg`  
       • `images/tiktok-icon-white-hair-x-webflow-template.svg`  
       • `images/glamorous-logo-icon-hair-x-webflow-template.svg`  
       • `images/lookbook-logo-icon-hair-x-webflow-template.svg`  
       • `images/stylelish-logo-icon-hair-x-webflow-template.svg`  
       • `images/trendy-threads-logo-icon-hair-x-webflow-template.svg`  
       • favicon / webclip

---

## 1 · Layout shell

### components/layout

- [ ] **Header.tsx** – desktop menu, mobile burger, cart button
      Evidence: `<div class="header-wrapper w-nav">…` lines 11-200 in original HTML.

- [ ] **Footer.tsx** – newsletter, social links, copyright
      Evidence: search `<footer` near bottom of source.

- [ ] **MobileNav.tsx** (slide-in menu) – triggered by hamburger icon.

> Interaction: “Pages” mega-dropdown → rewrite with controlled state, remove Webflow data-attributes.

---

## 2 · Home page sections

Create each JSX module inside `src/components/sections/`, import into `pages/Home.tsx` in this order.

| Section          | File             | Evidence snippet                                     | Key assets                                                                      |
| ---------------- | ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Hero             | Hero.tsx         | lines 275-320 – `class="full-image-content hero-v1"` | `images/beauty-and-wellness-hero-hair-x-webflow-template.jpg` + srcset variants |
| Services grid    | ServicesGrid.tsx | search `services-v1` grid block                      | `images/brush-hair-beauty-salon-hair-x-webflow-template.jpg` etc.               |
| Community photos | Community.tsx    | `community-image-01`-06                              | six community\* images                                                          |
| Brands strip     | BrandsStrip.tsx  | logo SVG strip                                       | Glamorous, Lookbook, Stylelish, Trendy-Threads                                  |
| Testimonials     | Testimonials.tsx | Swiper block with avatars                            | avatar images (to list)                                                         |
| CTA banner       | CtaBanner.tsx    | `cta-v1` section                                     | none (gradient bg)                                                              |

Mark each section done when:

- JSX renders without TS errors
- Visual match vs. original at 1440 px & 375 px
- Hover / dropdown interactions work (Framer-Motion or CSS; **no webflow.js**)

---

## 3 · Routing

- [ ] Add `router.tsx` (TanStack Router) – map `/` ➜ `<Home />`.
- [ ] Wrap `RouterProvider` in `main.tsx`.

---

## 4 · Cleanup / polish (stretch)

- [ ] Replace icon webfonts with inline SVGs.
- [ ] Extract shared UI primitives (Button, Card, Icon).
- [ ] Remove unused Webflow CSS; migrate to CSS-Modules/Tailwind.
- [ ] Lighthouse ≥ 90 mobile.

---

### Evidence sources

• HTML: `../mukyala/home-pages/home-v1.html`  
• `grep -o "images/[A-Za-z0-9._-]*" … | sort -u` → initial asset list  
• CSS: `css/mukyala-2.webflow.css` (classnames, @font-face)
