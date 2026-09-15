/**
 * Single source of truth for per-service hover/detail videos.
 *
 * Consumed by FeaturedServices (home), Services (index grid), and
 * ServiceDetail. Keys are service slugs as served by the live catalog.
 *
 * The legacy-menu keys stay through the menu-migration window so cards keep
 * their motion until the catalog cutover completes. New-menu slugs are mapped
 * to existing footage only where that footage genuinely shows the treatment.
 * TODO(operator): shoot dedicated footage for the remaining opening-menu
 * services (signature-facial, deluxe-ritual-facial, nano-needling,
 * body-scrub-ritual, back-facial, led-add-on) — tracked in
 * NOTES/spa-pages.md item B2.
 */
export const SERVICE_VIDEO_BY_SLUG: Record<string, { src: string }> = {
  // Opening menu (2026-09)
  'chemical-peel': { src: '/videos/chemical-peel.mp4' },
  'dermaplane-facial': { src: '/videos/dermaplaning-facial.mp4' },

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
