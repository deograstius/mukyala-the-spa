import { trackViewContent } from '@app/analytics';
import { setPageMeta } from '@app/seo';
import Community from '@features/home/Community';
import { useServicesQuery } from '@hooks/catalog.api';
import MediaCard from '@shared/cards/MediaCard';
import HeroSection from '@shared/sections/HeroSection';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
// Container/Section not needed; HeroSection wraps layout
import { useEffect } from 'react';
import { serviceVideoSrc } from '../data/serviceVideos';

export default function Services() {
  useEffect(() => {
    setPageMeta(
      'Services',
      'Facials, peels, dermaplaning, and body rituals by licensed estheticians in Carlsbad. Browse the full Mukyala Day Spa service menu with prices.',
      '/services',
    );
    // Index-level view_content event so we can measure category interest
    // independently of which card the visitor clicks. Per-card pageviews fire
    // from ServiceDetail.
    trackViewContent({
      contentName: 'Services index',
      contentCategory: 'services_index',
    });
  }, []);
  const { data: services, isLoading, isError } = useServicesQuery();

  return (
    <>
      <HeroSection variant="content-only" sectionClassName="hero v13">
        <div className="inner-container _518px center">
          <div className="text-center">
            <Reveal>
              <h1 className="display-11">Services</h1>
            </Reveal>
            <Reveal>
              <div className="mg-top-16px">
                <p className="paragraph-large">
                  Explore our signature facials and treatments. Curated for results and delivered
                  with timeless care.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="mg-top-64px">
          <div className="grid-2-columns gap-row-30px">
            {isLoading && <div>Loading services…</div>}
            {isError && <div role="alert">Failed to load services.</div>}
            {!isLoading && !isError && services && (
              <RevealStagger>
                {services.map((s) => (
                  <MediaCard
                    key={s.href}
                    title={s.title}
                    priceCents={s.priceCents}
                    image={s.image}
                    imageSrcSet={s.imageSrcSet}
                    imageSizes={s.imageSizes}
                    videoSrc={serviceVideoSrc(s.slug)}
                    href={s.href}
                    ctaId={s.slug ? `service-card-${s.slug}` : undefined}
                    className="beauty-services-link-item w-inline-block"
                    wrapperClassName="image-wrapper aspect-square"
                    imageClassName="card-image _w-h-100"
                    overlayClassName="bg-image-overlay overlay-caption"
                    contentClassName="content-card-services"
                    titleClassName="card-title display-7 text-neutral-100"
                  />
                ))}
              </RevealStagger>
            )}
          </div>
        </div>
      </HeroSection>

      <Community />
    </>
  );
}
