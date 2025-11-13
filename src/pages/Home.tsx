import AboutBlurb from '@features/home/AboutBlurb';
import Community from '@features/home/Community';
import FeaturedProducts from '@features/home/FeaturedProducts';
import Hero from '@features/home/Hero';
import LocationSpotlight from '@features/home/LocationSpotlight';
import { buildFallbackHomeData, useHomeData } from '@features/home/useHomeData';
import ServicesGrid from '@features/services/ServicesGrid';
import { useMemo } from 'react';

function Home() {
  const { data, isLoading, isError } = useHomeData();
  const fallback = useMemo(() => buildFallbackHomeData(), []);
  const homeData = data ?? fallback;
  const isPending = isLoading && !data;

  return (
    <>
      {isError ? (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          We’re refreshing live availability — showing our saved experience for now.
        </div>
      ) : null}
      <Hero
        headline={homeData.hero.headline}
        subheadline={homeData.hero.subheadline}
        cta={homeData.hero.cta}
        image={homeData.hero.image}
        isLoading={isPending}
      />
      <AboutBlurb />
      <ServicesGrid services={homeData.featuredServices} isLoading={isPending} />
      <FeaturedProducts products={homeData.featuredProducts} isLoading={isPending} />
      <LocationSpotlight location={homeData.location} />
      <Community links={homeData.community} />
    </>
  );
}

export default Home;
