import { setBaseTitle } from '@app/seo';
import { emitTelemetry } from '@app/telemetry';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import DetailLayout from '@shared/layouts/DetailLayout';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import DetailMeta from '@shared/ui/DetailMeta';
import Section from '@shared/ui/Section';
import ThumbHashPlaceholder from '@shared/ui/ThumbHashPlaceholder';
import { useLoaderData } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import type { ServiceItem } from '../types/service';

const SERVICE_DETAIL_VIDEO_BY_SLUG: Record<string, { src: string }> = {
  'brow-lamination': { src: '/videos/brow-lamination.mp4' },
  'chemical-peel': { src: '/videos/chemical-peel.mp4' },
  'dermaplaning-facial': { src: '/videos/dermaplaning-facial.mp4' },
  'full-body-wax': { src: '/videos/full-body-wax.mp4' },
  hydrafacial: { src: '/videos/hydrafacial.mp4' },
  'lash-extensions': { src: '/videos/lash-extensions.mp4' },
  'microcurrent-facial': { src: '/videos/microcurrent-facial.mp4' },
  'so-africal-facial': { src: '/videos/so-africal-facial.mp4' },
};

export default function ServiceDetail() {
  const service = useLoaderData({ from: '/services/$slug' }) as ServiceItem;
  const slug = service.slug || '';
  const video = slug ? SERVICE_DETAIL_VIDEO_BY_SLUG[slug] : undefined;
  const hasVideo = Boolean(video?.src);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    setBaseTitle(service.title);
  }, [service.title]);

  useEffect(() => {
    if (slug)
      emitTelemetry({
        event: 'service_view',
        serviceSlug: slug,
        route: window.location.pathname,
        path: window.location.pathname,
        method: 'GET',
        referrer: document.referrer || undefined,
      });
  }, [slug]);

  const media = hasVideo ? (
    <div className="aspect-video">
      <div className="media-frame">
        <ThumbHashPlaceholder src={video!.src} hidden={videoReady} />
        <video
          className="card-video _w-h-100"
          src={video!.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoReady(true)}
        />
      </div>
    </div>
  ) : (
    <ImageCardMedia
      src={service.image}
      srcSet={service.imageSrcSet}
      sizes={service.imageSizes}
      alt={service.title}
      wrapperClassName="image-wrapper aspect-video"
      imageClassName="card-image _w-h-100 fit-cover"
    />
  );

  return (
    <Section>
      <Container>
        <DetailLayout
          media={media}
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
              <ButtonLink
                href="/reservation"
                size="large"
                data-cta-id="service-detail-book-reservation"
              >
                <div className="text-block">Book a reservation</div>
              </ButtonLink>
            </div>
          }
        />
      </Container>
    </Section>
  );
}
