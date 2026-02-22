import type { ServiceItem } from '@app-types/service';
import MediaCard from '@shared/cards/MediaCard';
import Container from '@shared/ui/Container';
import DiagonalIconButton from '@shared/ui/DiagonalIconButton';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import SectionHeader from '@shared/ui/SectionHeader';
import { Link } from '@tanstack/react-router';

type FeaturedServicesProps = {
  services?: ServiceItem[];
  isLoading?: boolean;
};

const SERVICE_CARD_VIDEO_BY_SLUG: Record<string, { src: string }> = {
  'brow-lamination': { src: '/videos/brow-lamination.mp4' },
  'chemical-peel': { src: '/videos/chemical-peel.mp4' },
  'dermaplaning-facial': { src: '/videos/dermaplaning-facial.mp4' },
  'full-body-wax': { src: '/videos/full-body-wax.mp4' },
  hydrafacial: { src: '/videos/hydrafacial.mp4' },
  'lash-extensions': { src: '/videos/lash-extensions.mp4' },
  'microcurrent-facial': { src: '/videos/microcurrent-facial.mp4' },
  'so-africal-facial': { src: '/videos/so-africal-facial.mp4' },
};

export default function FeaturedServices({ services = [], isLoading }: FeaturedServicesProps) {
  const featured = services.slice(0, 3);
  const hasServices = featured.length > 0;

  return (
    <Section className="section-pad-top-none">
      <Container>
        <Reveal>
          <SectionHeader
            title="Services, tailored with intention"
            actions={
              <Link
                to="/services"
                preload="intent"
                className="link link-center large w-inline-block"
                data-cta-id="home-featured-services-browse-services"
              >
                <div>Browse services</div>
                <div className="item-icon-right medium" aria-hidden="true">
                  <div className="icon-font-rounded"></div>
                </div>
              </Link>
            }
          />
        </Reveal>

        <div className="mg-top-32px">
          <div
            className="home-featured-services-grid"
            aria-busy={!hasServices && isLoading ? 'true' : undefined}
          >
            {!hasServices && isLoading ? (
              <div role="status" className="paragraph-large">
                Loading services…
              </div>
            ) : null}

            {hasServices ? (
              <RevealStagger>
                {featured.map((service) => {
                  const href = service.href ?? (service.slug ? `/services/${service.slug}` : '#');
                  const video = service.slug ? SERVICE_CARD_VIDEO_BY_SLUG[service.slug] : undefined;
                  return (
                    <MediaCard
                      key={href}
                      title={service.title}
                      image={service.image}
                      imageSrcSet={service.imageSrcSet}
                      imageSizes={service.imageSizes}
                      videoSrc={video?.src}
                      href={href}
                      ctaId={service.slug ? `home-featured-service-${service.slug}` : undefined}
                      className="beauty-services-link-item w-inline-block"
                      wrapperClassName="image-wrapper aspect-square"
                      imageClassName="card-image _w-h-100"
                      overlayClassName="bg-image-overlay overlay-15"
                      contentClassName="content-card-services"
                      titleClassName="card-title display-7 text-neutral-100"
                      rightElement={<DiagonalIconButton />}
                    />
                  );
                })}

                <Link
                  to="/services"
                  preload="intent"
                  className="home-featured-services-browse-tile aspect-square"
                  data-cta-id="home-featured-services-browse-tile"
                >
                  <div className="home-featured-services-browse-tile-content">
                    <div className="link link-center large">
                      <div>Browse services</div>
                      <div className="item-icon-right medium" aria-hidden="true">
                        <div className="icon-font-rounded"></div>
                      </div>
                    </div>
                  </div>
                </Link>
              </RevealStagger>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
