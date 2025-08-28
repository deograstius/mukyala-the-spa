import MediaCard from '@shared/cards/MediaCard';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Grid from '@shared/ui/Grid';
import Section from '@shared/ui/Section';
import SectionHeader from '@shared/ui/SectionHeader';

interface Service {
  title: string;
  image: string;
  imageSrcSet?: string;
  href: string;
}

// Images are expected in `public/images/` using the filenames referenced below.
// Include responsive sizes (e.g., 500w/800w/1200w) to match existing `srcSet`.

const services: Service[] = [
  {
    title: 'Baobab Glow Facial',
    image: '/images/baobab-glow-facial.jpg',
    imageSrcSet:
      '/images/baobab-glow-facial-p-500.jpg 500w, /images/baobab-glow-facial-p-800.jpg 800w, /images/baobab-glow-facial.jpg 1024w',
    href: '/services/baobab-glow-facial',
  },
  {
    title: 'Kalahari Melon Hydration Facial',
    image: '/images/kalahari-melon-hydration-facial.jpg',
    imageSrcSet:
      '/images/kalahari-melon-hydration-facial-p-500.jpg 500w, /images/kalahari-melon-hydration-facial-p-800.jpg 800w, /images/kalahari-melon-hydration-facial.jpg 1024w',
    href: '/services/kalahari-melon-hydration-facial',
  },
  {
    title: 'Rooibos Radiance Facial',
    image: '/images/rooibos-radiance-facial.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-facial-p-500.jpg 500w, /images/rooibos-radiance-facial-p-800.jpg 800w, /images/rooibos-radiance-facial.jpg 1024w',
    href: '/services/rooibos-radiance-facial',
  },
  {
    title: 'Shea Gold Collagen Lift',
    image: '/images/shea-gold-collagen-lift.jpg',
    imageSrcSet:
      '/images/shea-gold-collagen-lift-p-500.jpg 500w, /images/shea-gold-collagen-lift-p-800.jpg 800w, /images/shea-gold-collagen-lift.jpg 1024w',
    href: '/services/shea-gold-collagen-lift',
  },
];

function ServicesGrid() {
  return (
    <Section className="pd-top-0px">
      <Container>
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

        <div className="mg-top-32px">
          <Grid className="grid-2-columns gap-row-30px">
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
          </Grid>
        </div>
      </Container>
    </Section>
  );
}

export default ServicesGrid;
