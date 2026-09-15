import { trackScheduleIntent, trackViewContent } from '@app/analytics';
import { setPageMeta } from '@app/seo';
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
import { serviceVideoSrc } from '../data/serviceVideos';
import type { ServiceItem } from '../types/service';

export default function ServiceDetail() {
  const service = useLoaderData({ from: '/services/$slug' }) as ServiceItem;
  const slug = service.slug || '';
  const videoSrc = serviceVideoSrc(slug);
  const hasVideo = Boolean(videoSrc);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    setPageMeta(
      service.title,
      service.description ||
        `${service.title} at Mukyala Day Spa in Carlsbad. Book your appointment with a licensed esthetician today.`,
      `/services/${slug}`,
    );
  }, [service.title, service.description, slug]);

  useEffect(() => {
    if (slug) {
      emitTelemetry({
        event: 'service_view',
        serviceSlug: slug,
        route: window.location.pathname,
        path: window.location.pathname,
        method: 'GET',
        referrer: document.referrer || undefined,
      });
      // chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
      // GTM/Meta `view_content` event (Meta-standard). Sits below
      // emitTelemetry so first-party telemetry remains the canonical source
      // and never depends on GTM consent state.
      trackViewContent({
        contentName: service.title,
        contentCategory: 'service',
        value: service.priceCents ? service.priceCents / 100 : undefined,
      });
    }
  }, [slug, service.title, service.priceCents]);

  const media = hasVideo ? (
    <div className="aspect-video">
      <div className="media-frame">
        <ThumbHashPlaceholder src={videoSrc!} hidden={videoReady} />
        <video
          className="card-video _w-h-100"
          src={videoSrc!}
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
              {/*
                chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
                Booking CTA call site — fires Meta-standard `schedule` event
                synchronously on click via trackScheduleIntent so the dataLayer
                push lands before navigation.
              */}
              <ButtonLink
                href="/reservation"
                size="large"
                data-cta-id="service-detail-book-reservation"
                onClick={() =>
                  trackScheduleIntent({
                    ctaId: 'service-detail-book-reservation',
                    serviceSlug: slug || undefined,
                    source: 'service_detail',
                  })
                }
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
