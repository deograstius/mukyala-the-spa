# Simplify Reservation – Implementation Plan

Goal: Replace the current reservation form with a simpler, clearer flow using just the essential fields while keeping the existing site styling and routing intact. No backend yet; capture intent locally and prepare for future API.

Scope (this branch)

- Keep page route and layout shell.
- Use existing services data for the “Service” dropdown.
- Fields: Name (required), Phone (required), Email (optional), Service (required), Date/Time (required).
- Remove the free-text message field and any extra inputs.
- Validation, a11y, and tests updated to match the simplified form.

Out of scope (future branches)

- Real availability lookup or scheduling integration.
- Staff notifications (email/SMS) and guest confirmations.
- Auth, customer profiles, or payment flows.

Milestones

1. UX & Copy

- [x] Confirm field labels, help text, and success message tone match brand voice.
- [x] Add a short privacy note for contact info.

2. UI Changes

- [x] Replace current form fields with: Name, Phone, Email (optional), Service, Date/Time.
- [x] Keep responsive layout: 2 columns desktop, 1 column mobile (already in place).
- [x] Use existing card + spacing for visual consistency.
- [x] Service: populate from `src/data/services.ts` (title + slug/id).
- [x] Date/Time: add single combined input.
- [x] Date/Time: add client-side future constraint (min now).
- [x] Date/Time: enforce opening hours window (basic client check).
- [x] Date/Time: validate in spa timezone (interpret input as PT, future + hours).
- [x] Date/Time: default picker to PT-friendly suggestions (UX only).
- [x] Phone input: numeric keypad and digits-only entry; format as you type.

3. Validation Rules

- [x] Name: 2–80 chars; letters/spaces (hyphens/apostrophes allowed).
- [x] Phone: required; sanity (>=7 digits) and normalization (digits-only).
- [x] Email: optional; validate format when provided.
- [x] Service: must match known service id/slug (enforced via select options).
- [x] Date/Time: must be in the future; respect basic opening hours window (config).

4. Data Model & Local Persistence

- [x] Shape: `{ name, phone, phoneNormalized, email?, serviceSlug, dateTime, at }`.
- [x] Persist last submitted request to `localStorage` for UX continuity (same key versioning).
- [x] No network calls yet; wire a seam for future API client.

5. Accessibility

- [x] Associate labels to inputs; preserve keyboard order.
- [x] Inline error messages with `role="alert"`.
- [x] Announce submit success via polite live region.
- [x] Ensure date/time picker is keyboard- and screen-reader-friendly.

6. Testing

- [x] Update existing Reservation unit test to reflect simplified fields and success path.
- [x] Add unit tests for validation failures (missing required fields, invalid phone, bad email).
- [x] E2E: update Playwright scenario to fill minimal fields and confirm success message.
- [x] Time-based tests: mock `Date.now()` for deterministic behavior.

7. Config & Types

- [x] Add types for `ReservationRequest`.
- [x] Add a config for opening hours/timezone (simple constants for now).
- [x] Ensure TypeScript strict mode passes.

8. Docs

- [x] Update README.md: outline the simplified flow and constraints.
- [x] Note future steps (availability, notifications, backend).

Rollout Notes

- This branch contains only plan and preparatory changes initially (this TODO).
- Subsequent commits will implement UI/validation/tests behind the same branch for review.
