import { API_BASE_URL } from '@app/config';
import AboutBlurb from '@features/home/AboutBlurb';
import Community from '@features/home/Community';
import FeaturedProducts from '@features/home/FeaturedProducts';
import Hero from '@features/home/Hero';
import LocationSpotlight from '@features/home/LocationSpotlight';
import { FALLBACK_HERO, useHomeData } from '@features/home/useHomeData';
import ServicesGrid from '@features/services/ServicesGrid';

function Home() {
  const { data, isLoading, isError } = useHomeData();
  const homeData = data;
  const isPending = isLoading && !homeData;
  const isLocalFallback = !API_BASE_URL;
  const heroContent = homeData?.hero ?? (isLocalFallback ? FALLBACK_HERO : undefined);

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
          We’re refreshing live availability — please try again shortly.
        </div>
      ) : null}
      {heroContent ? (
        <Hero
          headline={heroContent.headline}
          subheadline={heroContent.subheadline}
          cta={heroContent.cta}
          image={heroContent.image}
          isLoading={isPending}
        />
      ) : null}
      <AboutBlurb />
      <ServicesGrid services={homeData?.featuredServices ?? []} isLoading={isPending} />
      <FeaturedProducts products={homeData?.featuredProducts ?? []} isLoading={isPending} />
      {homeData?.location ? <LocationSpotlight location={homeData.location} /> : null}
      {homeData?.community ? <Community links={homeData.community} /> : null}
    </>
  );
}

export default Home;
