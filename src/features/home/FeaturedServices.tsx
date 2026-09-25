import type { ServiceItem } from '@app-types/service';
import MediaCard from '@shared/cards/MediaCard';
import Container from '@shared/ui/Container';
import DiagonalIconButton from '@shared/ui/DiagonalIconButton';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import SectionHeader from '@shared/ui/SectionHeader';
import { Link } from '@tanstack/react-router';
import { serviceVideoPortraitSrc, serviceVideoSrc } from '../../data/serviceVideos';

type FeaturedServicesProps = {
  services?: ServiceItem[];
  isLoading?: boolean;
};

/*
 * Two layouts, chosen by how many services the menu has (operator decision
 * 2026-09-24):
 *
 *   exactly one  -> "solo": the card takes the left half of the section and
 *                   the copy explains that the spa is focused on one facial.
 *                   A three-column grid with one small square and two empty
 *                   columns read as an unfinished page.
 *   two or more  -> the original three-up grid, unchanged.
 */
export default function FeaturedServices({ services = [], isLoading }: FeaturedServicesProps) {
  const featured = services.slice(0, 3);
  const hasServices = featured.length > 0;

  if (featured.length === 1) {
    return <SoloService service={featured[0]} />;
  }

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

        <div className="mg-top-40px">
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
                  return (
                    <MediaCard
                      key={href}
                      title={service.title}
                      priceCents={service.priceCents}
                      image={service.image}
                      imageSrcSet={service.imageSrcSet}
                      imageSizes={service.imageSizes}
                      videoSrc={serviceVideoSrc(service.slug)}
                      href={href}
                      ctaId={service.slug ? `home-featured-service-${service.slug}` : undefined}
                      className="beauty-services-link-item w-inline-block"
                      wrapperClassName="image-wrapper aspect-square"
                      imageClassName="card-image _w-h-100"
                      overlayClassName="bg-image-overlay overlay-caption"
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

function SoloService({ service }: { service: ServiceItem }) {
  const href = service.href ?? (service.slug ? `/services/${service.slug}` : '#');
  return (
    <Section className="section-pad-top-none">
      <Container>
        <div className="home-featured-service-solo">
          <Reveal>
            <MediaCard
              title={service.title}
              priceCents={service.priceCents}
              image={service.image}
              imageSrcSet={service.imageSrcSet}
              imageSizes={service.imageSizes}
              videoSrc={serviceVideoPortraitSrc(service.slug)}
              href={href}
              ctaId={service.slug ? `home-featured-service-${service.slug}` : undefined}
              className="beauty-services-link-item w-inline-block"
              wrapperClassName="image-wrapper aspect-4-5"
              imageClassName="card-image _w-h-100"
              overlayClassName="bg-image-overlay overlay-caption"
              contentClassName="content-card-services"
              titleClassName="card-title display-7 text-neutral-100"
              rightElement={<DiagonalIconButton />}
            />
          </Reveal>
          <Reveal delay={0.15}>
            <div className="home-featured-service-solo-copy">
              <h2 className="display-9">We are focused on one thing.</h2>
              <p className="home-featured-service-solo-subtitle">Giving you the best facial.</p>
              <p className="paragraph-large">
                Every visit starts with a real look at your skin, then a facial built for it: double
                cleanse, exfoliation, extractions, a mask, and finishing serums chosen for you. You
                leave with clear at-home steps, not a sales pitch.
              </p>
              {service.duration ? (
                <p className="paragraph-small home-featured-service-solo-meta">
                  {service.title}, {service.duration.replace(/\bmin\b/, 'minutes')} with a licensed
                  esthetician.
                </p>
              ) : null}
              <div className="buttons-row left home-featured-service-solo-actions">
                <Link
                  to="/reservation"
                  preload="intent"
                  className="button-primary large w-inline-block"
                  data-cta-id="home-featured-service-solo-book"
                >
                  <div className="text-block">Book the {service.title}</div>
                </Link>
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
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
