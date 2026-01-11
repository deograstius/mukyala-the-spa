import { setBaseTitle } from '@app/seo';
import ImageCardMedia from '@shared/cards/ImageCardMedia';
import DetailLayout from '@shared/layouts/DetailLayout';
import ButtonLink from '@shared/ui/ButtonLink';
import Container from '@shared/ui/Container';
import DetailMeta from '@shared/ui/DetailMeta';
import Section from '@shared/ui/Section';
import { useLoaderData } from '@tanstack/react-router';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { ServiceItem } from '../types/service';

const SERVICE_DETAIL_VIDEO_BY_SLUG: Record<string, { src: string }> = {
  'so-africal-facial': { src: '/videos/so-africal-facial.mp4' },
};

export default function ServiceDetail() {
  const service = useLoaderData({ from: '/services/$slug' }) as ServiceItem;
  const prefersReduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = SERVICE_DETAIL_VIDEO_BY_SLUG[service.slug];

  useEffect(() => {
    setBaseTitle(service.title);
  }, [service.title]);

  const media =
    prefersReduced || !video ? (
      <ImageCardMedia
        src={service.image}
        srcSet={service.imageSrcSet}
        sizes={service.imageSizes}
        alt={service.title}
        wrapperClassName="image-wrapper border-radius-16px"
        imageClassName="card-image _w-h-100"
      />
    ) : (
      <div
        className="image-wrapper border-radius-16px aspect-video"
        onMouseEnter={() => {
          try {
            videoRef.current?.pause();
          } catch {
            // no-op (jsdom)
          }
        }}
        onMouseLeave={() => {
          const el = videoRef.current;
          if (!el) return;
          try {
            const maybePromise = el.play();
            if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
              void (maybePromise as Promise<void>).catch(() => {});
            }
          } catch {
            // no-op (jsdom / autoplay policy)
          }
        }}
      >
        <video
          ref={videoRef}
          className="card-video _w-h-100"
          src={video.src}
          poster={service.image}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      </div>
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
