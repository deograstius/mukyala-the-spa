import type { ServiceItem } from '@app-types/service';
import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import DiagonalIconButton from '@shared/ui/DiagonalIconButton';
import Grid from '@shared/ui/Grid';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import SectionHeader from '@shared/ui/SectionHeader';

type ServicesGridProps = {
  services?: ServiceItem[];
  isLoading?: boolean;
};

const SERVICE_CARD_VIDEO_BY_SLUG: Record<string, { src: string }> = {
  'so-africal-facial': { src: '/videos/so-africal-facial.mp4' },
};

function ServicesGrid({ services = [], isLoading }: ServicesGridProps) {
  const hasServices = services.length > 0;
  return (
    <Section className="section-pad-top-none">
      <Container>
        <Reveal>
          <SectionHeader
            title="Services, tailored with intention"
            actions={
              <>
                <ButtonLink
                  href="/reservation"
                  size="large"
                  data-cta-id="services-grid-book-reservation"
                >
                  <div className="text-block">Book a reservation</div>
                </ButtonLink>
                <ButtonLink
                  href="/services"
                  variant="link"
                  className="link-center"
                  data-cta-id="services-grid-browse-services"
                >
                  <div>Browse services</div>
                  <div className="item-icon-right medium">
                    <div className="icon-font-rounded"></div>
                  </div>
                </ButtonLink>
              </>
            }
          />
        </Reveal>

        <div className="mg-top-32px">
          <Grid className="grid-2-columns gap-row-30px">
            {!hasServices && isLoading ? (
              <div role="status" className="paragraph-large">
                Loading services…
              </div>
            ) : null}
            {hasServices ? (
              <RevealStagger>
                {services.map((service) => {
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
                      ctaId={service.slug ? `service-card-${service.slug}` : undefined}
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
              </RevealStagger>
            ) : null}
          </Grid>
        </div>
      </Container>
    </Section>
  );
}

export default ServicesGrid;
