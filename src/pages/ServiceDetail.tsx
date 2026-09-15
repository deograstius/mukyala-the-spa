import { trackScheduleIntent, trackViewContent } from '@app/analytics';
import { setPageMeta } from '@app/seo';
import { emitTelemetry } from '@app/telemetry';
import { useServicesQuery } from '@hooks/catalog.api';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import MediaCard from '@shared/cards/MediaCard';
import DetailLayout from '@shared/layouts/DetailLayout';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import DetailMeta from '@shared/ui/DetailMeta';
import Section from '@shared/ui/Section';
import ThumbHashPlaceholder from '@shared/ui/ThumbHashPlaceholder';
import { Link, useLoaderData } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { serviceVideoSrc } from '../data/serviceVideos';
import type { ServiceItem } from '../types/service';

export default function ServiceDetail() {
  const service = useLoaderData({ from: '/services/$slug' }) as ServiceItem;
  const slug = service.slug || '';
  const videoSrc = serviceVideoSrc(slug);
  const hasVideo = Boolean(videoSrc);
  const [videoReady, setVideoReady] = useState(false);
  // Related-treatments strip (shares the Services query cache; no extra load
  // when the visitor came from the index).
  const { data: allServices } = useServicesQuery();
  const related = (allServices ?? []).filter((s) => s.slug !== slug).slice(0, 3);

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
                  'A signature treatment from Mukyala Day Spa. Email us at info@mukyala.com and we’ll walk you through what to expect.'}
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
              <p className="paragraph-small mg-top-16px">
                Not sure it’s right for you?{' '}
                <Link to="/consultation" className="text-link">
                  Start a free consultation
                </Link>
                . Plans change? See our{' '}
                <Link to="/terms" hash="cancellations" className="text-link">
                  cancellation policy
                </Link>
                .
              </p>
            </div>
          }
        />
      </Container>

      {related.length > 0 ? (
        <Container>
          <div className="mg-top-64px">
            <h2 className="display-9">More treatments</h2>
            <div className="mg-top-40px">
              <div className="w-layout-grid grid-3-columns gap-row-30px services-grid">
                {related.map((s) => (
                  <MediaCard
                    key={s.href}
                    title={s.title}
                    priceCents={s.priceCents}
                    image={s.image}
                    imageSrcSet={s.imageSrcSet}
                    imageSizes={s.imageSizes}
                    videoSrc={serviceVideoSrc(s.slug)}
                    href={s.href}
                    ctaId={s.slug ? `related-service-${s.slug}` : undefined}
                    className="beauty-services-link-item w-inline-block"
                    wrapperClassName="image-wrapper aspect-square"
                    imageClassName="card-image _w-h-100"
                    overlayClassName="bg-image-overlay overlay-caption"
                    contentClassName="content-card-services"
                    titleClassName="card-title display-7 text-neutral-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      ) : null}
    </Section>
  );
}
