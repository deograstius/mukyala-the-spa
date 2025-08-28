import { setBaseTitle } from '@app/seo';
import Community from '@features/home/Community';
import MediaCard from '@shared/cards/MediaCard';
import HeroSection from '@shared/sections/HeroSection';
// Container/Section not needed; HeroSection wraps layout
import { useEffect } from 'react';
import { services } from '../data/services';

export default function Services() {
  useEffect(() => {
    setBaseTitle('Services');
  }, []);

  return (
    <>
      <HeroSection variant="content-only" sectionClassName="hero v13">
        <div className="inner-container _518px center">
          <div className="text-center">
            <h1 className="display-11">Services</h1>
            <div className="mg-top-16px">
              <p className="paragraph-large">
                Explore our signature facials and treatments — curated for results, delivered with
                timeless care.
              </p>
            </div>
          </div>
        </div>
        <div className="mg-top-64px">
          <div className="grid-2-columns gap-row-30px">
            {services.map((s) => (
              <MediaCard
                key={s.href}
                title={s.title}
                image={s.image}
                imageSrcSet={s.imageSrcSet}
                imageSizes={s.imageSizes}
                href={s.href}
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
          </div>
        </div>
      </HeroSection>

      <Community />
    </>
  );
}
