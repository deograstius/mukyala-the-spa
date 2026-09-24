/**
 * Single source of truth for per-service hover/detail videos.
 *
 * Consumed by FeaturedServices (home), Services (index grid), and
 * ServiceDetail. Keys are service slugs as served by the live catalog.
 *
 * The legacy-menu keys stay through the menu-migration window so cards keep
 * their motion until the catalog cutover completes. New-menu slugs are mapped
 * to the closest existing footage (interim, same policy as the per-service
 * imagery) so no card loses its motion.
 * TODO(operator): shoot dedicated footage for the opening-menu services —
 * back-facial and led-add-on have no stand-in at all — tracked in
 * NOTES/spa-pages.md item B2.
 */
export const SERVICE_VIDEO_BY_SLUG: Record<string, { src: string; portraitSrc?: string }> = {
  // Opening menu (2026-09). Interim policy (mirrors the per-service imagery
  // in src/data/services.ts): each service uses the closest existing spa
  // footage so cards keep their motion until commissioned footage lands —
  // pairings follow the same interim image already chosen for each service.
  'chemical-peel': { src: '/videos/chemical-peel.mp4' },
  'dermaplane-facial': { src: '/videos/dermaplaning-facial.mp4' },
  // Dedicated footage (operator, 2026-09-24): Aryea mid-facial from the
  // phone clip IMG_5650.mov, zoomed out as far as the portrait allows (full
  // width) and cut square for the cards; the detail hero crops it with a
  // top-biased object-position. Muted, 900x900, 24fps.
  // portraitSrc: the same clip cut 4:5 (720x900, crop 2160x2700 at y=190,
  // headroom kept above Aryea) for the one-service home layout, which shows
  // a taller card than the square grid.
  'signature-facial': {
    src: '/videos/signature-facial.mp4',
    portraitSrc: '/videos/signature-facial-portrait.mp4',
  },
  'deluxe-ritual-facial': { src: '/videos/hydrafacial.mp4' },
  'nano-needling': { src: '/videos/microcurrent-facial.mp4' },
  'body-scrub-ritual': { src: '/videos/full-body-wax.mp4' },
  // back-facial + led-add-on: intentionally static — no existing footage
  // plausibly shows these treatments; awaiting the operator shoot.

  // Legacy menu (pre-migration live catalog)
  'brow-lamination': { src: '/videos/brow-lamination.mp4' },
  'dermaplaning-facial': { src: '/videos/dermaplaning-facial.mp4' },
  'full-body-wax': { src: '/videos/full-body-wax.mp4' },
  hydrafacial: { src: '/videos/hydrafacial.mp4' },
  'lash-extensions': { src: '/videos/lash-extensions.mp4' },
  'microcurrent-facial': { src: '/videos/microcurrent-facial.mp4' },
  'so-africal-facial': { src: '/videos/so-africal-facial.mp4' },
};

/** Convenience lookup that tolerates missing/empty slugs. */
export function serviceVideoSrc(slug?: string): string | undefined {
  return slug ? SERVICE_VIDEO_BY_SLUG[slug]?.src : undefined;
}

/** Portrait (4:5) cut when one exists, else the standard clip. */
export function serviceVideoPortraitSrc(slug?: string): string | undefined {
  if (!slug) return undefined;
  const entry = SERVICE_VIDEO_BY_SLUG[slug];
  return entry?.portraitSrc ?? entry?.src;
}
