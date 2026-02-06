import HeroSection from '@shared/sections/HeroSection';
import ButtonLink from '@shared/ui/ButtonLink';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import { FALLBACK_HERO } from './useHomeData';

type HeroProps = {
  headline?: string;
  subheadline?: string;
  cta?: {
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

function Hero({ headline, subheadline, cta, image, isLoading }: HeroProps) {
  const heroImage = image ?? FALLBACK_HERO.image;
  const heroHeadline = headline || FALLBACK_HERO.headline;
  const heroSubheadline = subheadline ?? FALLBACK_HERO.subheadline;
  const heroCta = cta ?? FALLBACK_HERO.cta;

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
        <RevealStagger>
          <div className="inner-container _842px">
            <Reveal>
              <div>
                <h1 className="display-11 text-neutral-100">{heroHeadline}</h1>
                {heroSubheadline ? (
                  <p className="paragraph-large text-neutral-100 mg-top-12px">{heroSubheadline}</p>
                ) : null}
              </div>
            </Reveal>
          </div>
          <div>
            <Reveal>
              {heroCta ? (
                <ButtonLink href={heroCta.href} size="large" variant="white">
                  <div className="text-block">{heroCta.label}</div>
                </ButtonLink>
              ) : null}
            </Reveal>
          </div>
        </RevealStagger>
      </div>
    </HeroSection>
  );
}

export default Hero;
