import { setTitle } from '@app/seo';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { useLoaderData } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ServiceItem } from '../types/service';

export default function ServiceDetail() {
  const service = useLoaderData<ServiceItem>({ from: '/services/$slug' });

  useEffect(() => {
    setTitle(`${service.title} – Mukyala Day Spa`);
  }, [service.title]);

  return (
    <Section>
      <Container>
        <div className="w-layout-grid grid-2-columns">
          <div className="image-wrapper border-radius-20px">
            <ImageCardMedia
              src={service.image}
              srcSet={service.imageSrcSet}
              sizes={service.imageSizes}
              alt={service.title}
              wrapperClassName="image-wrapper border-radius-16px"
              imageClassName="card-image _w-h-100"
            />
          </div>
          <div>
            <h1 className="display-9">{service.title}</h1>
            <div className="mg-top-24px">
              <p className="paragraph-large">
                A signature treatment from Mukyala Day Spa. Detailed description coming soon.
              </p>
            </div>
            <div className="mg-top-32px">
              <ButtonLink href="/reservation" size="large">
                <div className="text-block">Make a Reservation</div>
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
