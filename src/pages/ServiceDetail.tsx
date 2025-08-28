import { setBaseTitle } from '@app/seo';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import DetailLayout from '@shared/layouts/DetailLayout';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import DetailMeta from '@shared/ui/DetailMeta';
import Section from '@shared/ui/Section';
import { useLoaderData } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ServiceItem } from '../types/service';

export default function ServiceDetail() {
  const service = useLoaderData<ServiceItem>({ from: '/services/$slug' });

  useEffect(() => {
    setBaseTitle(service.title);
  }, [service.title]);

  return (
    <Section>
      <Container>
        <DetailLayout
          media={
            <ImageCardMedia
              src={service.image}
              srcSet={service.imageSrcSet}
              sizes={service.imageSizes}
              alt={service.title}
              wrapperClassName="image-wrapper border-radius-16px"
              imageClassName="card-image _w-h-100"
            />
          }
          title={<h1 className="display-9">{service.title}</h1>}
          meta={
            <DetailMeta
              priceCents={service.priceCents}
              duration={service.duration}
              className="mg-top-12px"
            />
          }
          description={
            <div className="mg-top-24px">
              <p className="paragraph-large">
                {service.description ||
                  'A signature treatment from Mukyala Day Spa. Detailed description coming soon.'}
              </p>
            </div>
          }
          actions={
            <div className="mg-top-32px">
              <ButtonLink href="/reservation" size="large">
                <div className="text-block">Make a Reservation</div>
              </ButtonLink>
            </div>
          }
        />
      </Container>
    </Section>
  );
}
