/*
 * featured.ts — chunk: spa-launch-readiness-seo-2026-05-09 (architect stub).
 *
 * `featuredServiceSlugs` previously referenced legacy menu slugs that no
 * longer exist in src/data/services.ts after the opening-menu rewrite:
 *   - 'hydrafacial'        → REMOVED
 *   - 'lash-extensions'    → REMOVED
 *   - 'brow-lamination'    → REMOVED
 *
 * Updated to the three flagship slugs from the new opening menu (architect
 * picks; implementer should validate with the operator before ship):
 *   1) 'signature-facial' — entry-point, lowest-friction $185 price point.
 *   2) 'dermaplane'       — visible-result service that pairs well with peels.
 *   3) 'nano-needling'    — premium-positioned, $250, supports the
 *                            licensed-esthetician + science-rooted positioning.
 *
 * TODO(architect): implementer to confirm with operator which 3 services
 * lead the home page's "Featured Services" carousel. If operator prefers
 * a different mix (e.g. 'signature-facial' + 'deluxe-ritual' + 'chemical-peel'
 * to lead with peel-curious guests), update the array below — no other code
 * changes needed; consumers index by slug into the services array.
 *
 * Product slugs untouched in this chunk — out of scope.
 */

export const featuredProductSlugs: string[] = [
  'b5-hydrating-serum',
  'glyco-resurfacing-cleanser',
  'sheerzinc-spf-30',
  'universal-cleansing-oil',
  'glutathione-hydrojelly-mask',
  'hyaluronic-acid-hydrojelly-mask',
  'purifying-charcoal-hydrojelly-mask',
  'wildcrafted-sea-moss-hydrojelly-mask',
];

export const featuredServiceSlugs: string[] = [
  'signature-facial',
  'dermaplane-facial',
  'nano-needling',
];
