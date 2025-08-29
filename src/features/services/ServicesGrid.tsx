import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Grid from '@shared/ui/Grid';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
import Section from '@shared/ui/Section';
import SectionHeader from '@shared/ui/SectionHeader';
import { services } from '../../data/services';

function ServicesGrid() {
  return (
    <Section className="pd-top-0px">
      <Container>
        <Reveal>
          <SectionHeader
            title="Our set of beauty services"
            actions={
              <>
                <ButtonLink href="/reservation" size="large">
                  <div className="text-block">Make a Reservation</div>
                </ButtonLink>
                <ButtonLink href="/services" variant="link" className="link-center">
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
            <RevealStagger>
              {services.map((service) => (
                <MediaCard
                  key={service.title}
                  title={service.title}
                  image={service.image}
                  imageSrcSet={service.imageSrcSet}
                  href={service.href}
                  className="beauty-services-link-item w-inline-block"
                  wrapperClassName="image-wrapper aspect-square"
                  imageClassName="card-image _w-h-100"
                  overlayClassName="bg-image-overlay overlay-15"
                  contentClassName="content-card-services"
                  titleClassName="card-title display-7 text-neutral-100"
                  rightElement={
                    <div className="secondary-button-icon white-button-inside-link">
                      <div className="icon-font-rounded diagonal-button-icon"></div>
                    </div>
                  }
                />
              ))}
            </RevealStagger>
          </Grid>
        </div>
      </Container>
    </Section>
  );
}

export default ServicesGrid;
