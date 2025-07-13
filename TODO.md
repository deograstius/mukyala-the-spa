# Mukyala Day Spa – React-Migration TODO

Goal: reproduce **home-v1** from the exported Webflow template as a fully-hand-written JSX page inside the Vite + React project – no dangerous `dangerouslySetInnerHTML` dumps.

This checklist is evidence-driven: every asset/component reference below is taken directly from `../mukyala/home-pages/home-v1.html` and its related CSS.

---

## 0 · Set-up

_Create once before converting any section._

### IMPORTANT: source of truth – `../mukyala/`

All markup, class names and assets originate from the raw Webflow export that
is checked in one level up from this repository (`../mukyala`). Whenever you
need to verify structure, grab an image, or copy CSS classes, **open the
corresponding file inside that folder first**.

```
../mukyala/
├── css/                       # normalize.css, webflow.css, mukyala-2.webflow.css
├── fonts/                     # webfonts referenced by CSS
├── images/                    # PNG/JPG/SVG assets for every page
├── js/                        # webflow runtime (ignored – we re-implement in React)
├── home-pages/                # home-v1.html (our main reference) + v2/v3
├── blog-pages/                # CMS-style blog templates (reference only)
├── locations-pages/
├── template-pages/            # changelog, style guide, etc.
├── extra-components/          # small reusable snippets in separate HTML
├── ... many individual *.html pages (about.html, services.html, etc.)
└── videos/
```

Guideline when porting:

1. Locate the section in `home-pages/home-v1.html` (search by class or text).
2. Inspect its immediate markup and copy only the **semantic** structure to
   JSX – skip `data-w-*` attributes and inline transforms.
3. Copy any referenced images from `../mukyala/images/` into
   `public/images/` (or `public/videos/` if needed).
4. Keep the original class names so existing global CSS continues to style the
   component.

- [x] **Global style import**  
       Copy the following into `src/styles/global.css` and import it in `main.tsx`:
      `css/normalize.css`, `css/webflow.css`, `css/mukyala-2.webflow.css`

- [x] **Fonts**  
       Copy webfont files referenced by Webflow CSS → `public/fonts/`
      • `fonts/line-rounded-icon-font-brix.woff` (icons)  
       • `fonts/social-media-icon-font-brix.woff` (social icons)  
       • `fonts/Switzer-*.woff` (text family)  
       • `fonts/fontello.woff` (misc icons)

- [x] **Shared assets**  
       Remaining SVGs to copy from `../mukyala/images/` → `public/images/`:  
       • `instagram-icon-white-hair-x-webflow-template.svg`  
       • `tiktok-icon-white-hair-x-webflow-template.svg`  
       • `glamorous-logo-icon-hair-x-webflow-template.svg`  
       • `lookbook-logo-icon-hair-x-webflow-template.svg`  
       • `stylelish-logo-icon-hair-x-webflow-template.svg`  
       • `trendy-threads-logo-icon-hair-x-webflow-template.svg`  
       • favicon / webclip (low-priority)

---

## 1 · Layout shell

### components/layout

- [x] Header.tsx – desktop menu, mobile burger, cart button (static)
- [x] Footer.tsx – newsletter, social links, copyright
- [x] MobileNav.tsx – slide-in panel for tablet/mobile, opens via hamburger
- [x] HeaderDropdown.tsx – replaces Webflow “Pages” mega-menu with controlled popover

Interaction goal: pure React state + CSS (no `w-dropdown` scripts)

---

## 2 · Home page sections

Each JSX module lives in `src/components/sections/` and is imported in `pages/Home.tsx`.

| Section          | File             | Evidence snippet (home-v1)                     | Key assets                                               | Status         |
| ---------------- | ---------------- | ---------------------------------------------- | -------------------------------------------------------- | -------------- |
| Hero             | Hero.tsx         | lines ~275-320 – `full-image-content hero-v1`  | hero jpg + srcset variants                               | ✅             |
| Services grid    | ServicesGrid.tsx | `services-v1` CMS block                        | 3 service images (brush-hair, drying-hair, brown-makeup) | ✅             |
| Brands + quote   | BrandsStrip.tsx  | Tabs menu `lookbook-logo-icon`… + quote panes  | 4 brand logo SVGs                                        | ⬜️             |
| Community photos | Community.tsx    | `Our community` grid, six `community-image-0*` | six community images + insta / tiktok white SVG icons    | ⬜️             |
| CTA banner       | CtaBanner.tsx    | `cta-v1` two-column card near bottom           | brush-hair image (already copied)                        | ✅             |
| (Optional) About | AboutBlurb.tsx   | small “About us” section right after hero      | none (only text)                                         | (nice-to-have) |

Section completion checklist:

- Unit/e2e tests in place (where meaningful).
- TypeScript ok.
- Visual regression vs. original (desktop/mobile).
- No Webflow runtime JS; simple React state/CSS only.

---

## 3 · Routing

Use TanStack Router v1:

- [ ] `router.tsx` – declare root + home route
- [ ] update `main.tsx` to render `<RouterProvider />` instead of bare `<Home />`
- (optional) code-split additional pages later

---

## 4 · Cleanup / polish (stretch)

- Replace icon webfonts with inline SVGs
- Extract shared UI primitives (Button, Card, Icon)
- Remove unused Webflow CSS; migrate to CSS-Modules/Tailwind
- Lighthouse ≥ 90 mobile

---

### Evidence sources

• HTML: `../mukyala/home-pages/home-v1.html`  
• `grep -o "images/[A-Za-z0-9._-]*" … | sort -u` → initial asset list  
• CSS: `css/mukyala-2.webflow.css` (classnames, @font-face)
