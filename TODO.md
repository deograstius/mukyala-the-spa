# Cart Port – Migration Plan (from Webflow export)

Source reference: `../mukyala/services.html` (cart widget in header) and `../mukyala/checkout.html` (checkout layout). Webflow uses `w-commerce-...` classes and a modal cart with a list, subtotal, and checkout action.

## Goals

- Implement an accessible Cart Drawer (modal/side‑sheet) that mirrors Webflow structure and styling.
- Integrate with existing `CartContext` for add/remove/set quantity and computed totals.
- Provide a minimal `/checkout` page that lists items and totals (no real payments yet).
- Reuse Webflow CSS classes where practical to reduce custom CSS.

## Non‑goals (for this phase)

- Payment gateway integration (Apple Pay, Google Pay, etc.).
- Shipping, taxes, discounts, multi‑currency.
- SKU options/variants.

---

## Tasks

1. Data & Computation

- [x] Add numeric price to product model to enable totals.
  - Option A: Extend `Product` with `priceCents: number` (preferred for accuracy).
  - [x] Option B: Parse `price` string (e.g., "$32.00") into cents at runtime (acceptable, less robust).
- [x] Add helpers: `formatCurrency(cents)`.
- [x] Consider persisting cart in `localStorage` (load on init + save on changes).
- [ ] (Optional) Add selectors for `cartItemsDetailed`, `subtotalCents` in a shared util.

2. Cart Drawer UI

- [x] Create `CartDrawer` component using an overlay + panel pattern (can reuse patterns from `MobileNav`).
  - [x] `role="dialog"`, `aria-modal="true"`, keyboard close on `Esc`, focus trap.
  - [x] Header: “Your Cart”, close button.
  - [x] List: map `cartItemsDetailed` → `CartItemRow` components.
  - [x] Footer: Subtotal and a primary button linking to `/checkout`.
  - [x] Empty state: “No items found.” with CTA to `/shop`.
- [x] Style alignment: Prefer Webflow classes already present:
  - Wrapper: `w-commerce-commercecartcontainer cart-container`
  - Header: `w-commerce-commercecartheader cart-header`
  - List: `w-commerce-commercecartlist cart-list`
  - Line: `w-commerce-commercecartlineitem cart-line-item`
  - Subtotal value: `w-commerce-commercecartordervalue cart-subtotal-number`
  - Button: `w-commerce-commercecartcheckoutbutton button-primary`

3. Cart Item Row

- [x] Implement `CartItemRow` with:
  - [ ] Product thumbnail (use existing images from product data).
  - [ ] Title (links to product detail), price, and line total.
  - [ ] Quantity control: `-` / `+` buttons bound to `setQty` (min 1) and `removeItem`.
  - [ ] Remove button (trash icon or “Remove”).
  - [ ] Respect Webflow item layout classes where possible for quick styling fit.

4. Header Integration

- [x] Replace current cart `<a href="/checkout">` with a button that opens the Cart Drawer (desktop), maintaining the count.
  - [x] Keep `/checkout` accessible via drawer CTA and via direct URL.
  - [x] Preserve accessible name (e.g., `aria-label="Open cart"`).

5. Checkout Page (minimal)

- [x] Add `src/pages/Checkout.tsx` to list items, quantities, and subtotal; no payment form.
- [x] Show an informational note: “Online checkout coming soon. Please call or visit to complete purchase.”
- [ ] Consider a “Clear cart” action on this page for convenience.

6. Routing & State Wiring

- [x] Add `CartDrawer` to `RootLayout` (so it’s available globally) or render within `Header`.
- [x] Provide `open/close` state via context or `Header` local state; expose an `openCart()` helper.

7. Accessibility

- [x] Dialog semantics (`role="dialog"`, labelled by heading), focus trap.
- [x] Keyboard operability for quantity controls and remove buttons.
- [ ] Return focus to opener on close.
- [ ] Live region (optional) to announce item added/removed.

8. Tests

- [ ] Unit tests (Vitest + Testing Library):
  - [x] Drawer opens from header button; empty state and CTA assertions.
  - [x] Closes via `Esc`.
  - [x] Renders populated list after adding.
  - [x] Quantity increments/decrements update subtotal.
  - [x] Remove item clears row and updates total/count.
  - [x] `document.title` unaffected; navigation to `/checkout` CTA has correct href.
- [ ] E2E (Playwright):
  - [ ] Add item → open cart → verify count and subtotal → navigate to `/checkout`.
  - [ ] Refresh persists cart if `localStorage` enabled (optional test).

9. Styles

- [ ] Reuse Webflow classes listed above; add minimal overrides in `src/styles/global.css` only if needed (z-index, spacing).
- [ ] Ensure mobile/desktop responsive behavior; avoid overlap with existing `MobileNav` overlay.

10. Migration Notes (Webflow → React)

- Webflow’s `w-commerce` classes provide structure; we emulate behavior with our `CartContext`.
- Quick‑checkout buttons (Apple/Google/Microsoft) are out of scope.
- We will not replicate Webflow’s injected scripts; the UI is purely React.

## Acceptance Criteria

- Header button opens a cart drawer listing items with images, titles, quantities, and line totals.
- Subtotal updates correctly when quantities change or items are removed.
- “Continue to Checkout” navigates to `/checkout` page that lists items and subtotal.
- All new unit tests pass; existing tests remain green; `vite build` succeeds.

## Follow‑ups (Future)

- Payment integration (Stripe Checkout / Payment Links / Shopify Buy SDK).
- Taxes, shipping, discount codes, and price books.
- Service booking cart (time slots, staff selection) unified with product cart.
