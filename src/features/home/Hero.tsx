import { trackScheduleIntent } from '@app/analytics';
import HeroSection from '@shared/sections/HeroSection';
import ButtonLink from '@shared/ui/ButtonLink';
import Reveal from '@shared/ui/Reveal';
import { FALLBACK_HERO } from './useHomeData';

type HeroProps = {
  // `headline` is intentionally NEVER rendered as text — the in-photo neon
  // "Mukyala" sign carries the brand moment, and tests pin the no-h1
  // invariant. The prop only feeds the aria-busy loading state.
  headline?: string;
  cta?: {
    label: string;
    href: string;
  };
  // Optional secondary CTA mirroring `cta`. Threaded from Home.tsx via heroContent.consultationCta
  // so SSR/CMS-driven values can override the FALLBACK_HERO default.
  consultationCta?: {
    label: string;
    href: string;
  };
  image?: {
    src: string;
    srcSet?: string;
    sizes?: string;
    alt?: string;
  };
  isLoading?: boolean;
};

function Hero({ headline, cta, consultationCta, image, isLoading }: HeroProps) {
  const heroImage = image ?? FALLBACK_HERO.image;
  const heroCta = cta ?? FALLBACK_HERO.cta;
  const heroConsultationCta = consultationCta ?? FALLBACK_HERO.consultationCta;

  return (
    <HeroSection
      variant="background"
      bgImage={{
        src: heroImage.src,
        srcSet: heroImage.srcSet,
        sizes: heroImage.sizes,
        alt:
          heroImage.alt ?? 'Front of Mukyala The Spa, suite J at 390 Oak Ave in Carlsbad Village',
      }}
      overlayClassName="hero-scrim"
      aria-busy={isLoading && !headline ? 'true' : undefined}
    >
      <div className="w-layout-grid grid-2-columns hero-v1-grid">
        {/*
          The hero carries no copy (operator, 2026-09-27): the photo of the
          shopfront does the talking and the two buttons sit across the bottom.
          `.hero-v1-grid` is `display: grid; grid-template-columns: 1fr auto`
          (public/css/mukyala-2.webflow.css L2152-2159); the background image is
          an absolutely-positioned sibling rendered by `HeroSection`, so the grid
          holds only the buttons row. The row's Reveal wrapper is the grid item
          and carries inline `gridColumn: '1 / -1'` so it spans both columns
          (no span utility exists in the Webflow CSS; inline beats specificity
          without `!important`).
        */}
        {/*
          Both CTAs share a single `.buttons-row left` row — the established codebase
          pattern for side-by-side button rows (see SectionHeader, AboutBlurb, Community,
          FeaturedProducts). `.buttons-row` (public/css/mukyala-2.webflow.css ~line 5644)
          applies `display: flex; grid-column-gap: 14px;` for visible breathing room
          between the buttons, and `.left` left-justifies. Both ButtonLinks use
          variant="white" + size="large" to keep font and style identical.

          Operator override: keep this row HORIZONTAL at every viewport. The sitewide
          mobile rule at public/css/mukyala-2.webflow.css line 10477 flips
          `.buttons-row` to `flex-direction: column; align-items: stretch; width: 100%;`
          below the mobile breakpoint. The inline style below scopes a per-instance
          override (inline beats selector specificity, so no `!important` is needed)
          so this hero row stays side-by-side even on narrow screens. Tradeoff per
          operator: at very narrow widths the buttons may visually crowd or overflow
          horizontally — that is the explicit preference (horizontal always over stacked).

          Equal-width split: the row's outer Reveal motion.div spans both grid columns
          via `gridColumn: '1 / -1'`. Below the 991px breakpoint the sitewide rule at
          public/css/mukyala-2.webflow.css line 8654 sets `.grid-2-columns.hero-v1-grid
          { justify-items: start; }` which would keep the spanning grid-item at
          content-width despite the column span. The inline `justifySelf: 'stretch'`
          (per-item override of the container's `justify-items`) plus `width: '100%'`
          (intrinsic-sizing fallback) on the Reveal motion.div force the buttons-row to
          fill its full spanned track. The row itself then takes `width: 100%` of that span,
          and each ButtonLink takes `flex: 1` so the two CTAs share the available
          horizontal space equally with the existing `.buttons-row` 14px column-gap
          preserved between them. Centered label text is already provided by the
          `.button-primary` Webflow class (`text-align: center; justify-content:
          center; align-items: center;` — public/css/mukyala-2.webflow.css ~L3492),
          so no `textAlign` override is needed when the anchor stretches.
          ButtonLink already spreads its `style` prop onto the rendered `<a>` via
          `...rest`, so passing inline `flex: 1` works without any API change and
          does not affect other ButtonLink usages elsewhere in the app.
        */}
        <Reveal
          delay={0.06}
          style={{ gridColumn: '1 / -1', justifySelf: 'stretch', width: '100%' }}
        >
          <div
            className="buttons-row left"
            style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}
          >
            {/*
              Booking CTA call site (home hero, primary button). The onClick
              fires the Meta-standard `schedule` event via trackScheduleIntent
              BEFORE navigation. The "Consultation" CTA below is intentionally
              NOT a booking event — it's a Lead-style form; `lead` fires only
              on successful submit.
            */}
            {heroCta ? (
              <ButtonLink
                href={heroCta.href}
                size="large"
                variant="white-filled"
                data-cta-id="home-hero-cta"
                onClick={() =>
                  trackScheduleIntent({
                    ctaId: 'home-hero-cta',
                    source: 'hero',
                  })
                }
                style={{ flex: 1 }}
              >
                <div className="text-block">{heroCta.label}</div>
              </ButtonLink>
            ) : null}
            {heroConsultationCta ? (
              <ButtonLink
                href={heroConsultationCta.href}
                size="large"
                variant="white"
                data-cta-id="home-hero-consultation-cta"
                style={{ flex: 1 }}
              >
                <div className="text-block">{heroConsultationCta.label}</div>
              </ButtonLink>
            ) : null}
          </div>
        </Reveal>
      </div>
    </HeroSection>
  );
}

export default Hero;
