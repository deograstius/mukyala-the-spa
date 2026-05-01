import HeroSection from '@shared/sections/HeroSection';
import ButtonLink from '@shared/ui/ButtonLink';
import Reveal from '@shared/ui/Reveal';
import { FALLBACK_HERO } from './useHomeData';

type HeroProps = {
  headline?: string;
  subheadline?: string;
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

function Hero({ headline, subheadline, cta, consultationCta, image, isLoading }: HeroProps) {
  const heroImage = image ?? FALLBACK_HERO.image;
  const heroSubheadline = subheadline ?? FALLBACK_HERO.subheadline;
  const heroCta = cta ?? FALLBACK_HERO.cta;
  const heroConsultationCta = consultationCta ?? FALLBACK_HERO.consultationCta;

  return (
    <HeroSection
      variant="background"
      bgImage={{
        src: heroImage.src,
        srcSet: heroImage.srcSet,
        sizes: heroImage.sizes,
        alt: heroImage.alt ?? 'Mukyala lobby with illuminated sign and seating',
      }}
      aria-busy={isLoading && !headline ? 'true' : undefined}
    >
      <div className="w-layout-grid grid-2-columns hero-v1-grid">
        {/*
          Layout (operator clarification 2026-04-25): `.hero-v1-grid` is a
          `display: grid` with `grid-template-columns: 1fr auto` (public/css/
          mukyala-2.webflow.css L2152-2159). The background image is rendered
          as an absolutely-positioned sibling of the grid by `HeroSection`
          (variant="background", src/shared/sections/HeroSection.tsx L83-101),
          NOT as a grid item — so the grid only contains text/buttons content.

          The buttons-row must span the FULL hero width (matching the picture's
          horizontal extent — the `.image-wrapper.full-section-image` is
          `position: absolute; inset: 0` inside `.full-image-content.hero-v1`,
          so its visible width === the entire `.full-image-content` content
          box). To achieve that, the buttons-row's Reveal wrapper is now a
          DIRECT child of `.hero-v1-grid` (sibling of the inner-container's
          Reveal) and carries inline `style={{ gridColumn: '1 / -1' }}` so the
          motion.div Reveal renders becomes a grid item that spans both columns.
          No grid-column-span utility class exists in mukyala-2.webflow.css
          (verified by grep of `grid-column`, `column-span`, `span 2`,
          `grid-column-span`, `span-all-columns`), so the inline style is the
          correct hook — inline beats selector specificity without needing
          `!important`.

          Why route the style through `Reveal`: each `<Reveal>` renders its own
          motion.div which IS the grid item when Reveal is a direct child of
          the grid. Putting `gridColumn` inside the motion.div would target a
          non-grid-item (no effect). Reveal accepts a `style` prop (mirrors the
          existing `className`) so the grid-span style lands on the correct
          element. Stagger feel from the prior `RevealStagger` is preserved by
          giving the second Reveal `delay={0.06}` (= `RevealStagger`'s default
          `interval`).

          The inner-container subheadline stays in column 1 (1fr); its `_842px`
          max-width (public/css/mukyala-2.webflow.css L3158-3160) keeps copy
          readable. With `grid-template-columns: 1fr auto` and column 2 empty,
          column 1 already takes the full grid width, so `gridColumn: '1 / -1'`
          on the buttons-row means it occupies that same full grid track width
          (and stays left-aligned via `.buttons-row.left`).
        */}
        <Reveal>
          <div className="inner-container _842px">
            {heroSubheadline ? (
              <p className="paragraph-large text-neutral-100 mg-top-12px">{heroSubheadline}</p>
            ) : null}
          </div>
        </Reveal>
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
            {heroCta ? (
              <ButtonLink
                href={heroCta.href}
                size="large"
                variant="white"
                data-cta-id="home-hero-cta"
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
