import { API_BASE_URL } from '@app/config';
import { DEFAULT_DESCRIPTION, setPageMeta } from '@app/seo';
import AboutBlurb from '@features/home/AboutBlurb';
import Community from '@features/home/Community';
import FeaturedProducts from '@features/home/FeaturedProducts';
import FeaturedServices from '@features/home/FeaturedServices';
import Hero from '@features/home/Hero';
import LocationSpotlight from '@features/home/LocationSpotlight';
import { buildFallbackHomeData, FALLBACK_HERO, useHomeData } from '@features/home/useHomeData';
import { reportCatalogUnavailable } from '@features/shop/catalogFallback';
import { useEffect, useMemo } from 'react';

function Home() {
  useEffect(() => {
    setPageMeta(null, DEFAULT_DESCRIPTION, '/');
  }, []);
  const { data, isLoading, isError, error } = useHomeData();
  // Degraded-state policy: on API error render the FULL static fallback (same
  // content the localhost build serves) behind the notice banner, instead of
  // a half-empty page where some sections vanish and others fall back.
  // Exception (spec #27): products have NO static fallback — the Featured
  // section shows the sold-out line, and the failure is logged + emitted so
  // the down-case is never graceful-and-undebuggable.
  const fallbackData = useMemo(() => (isError ? buildFallbackHomeData() : undefined), [isError]);
  useEffect(() => {
    if (isError) reportCatalogUnavailable('home', error);
  }, [isError, error]);
  const homeData = data ?? fallbackData;
  const isPending = isLoading && !homeData;
  const isLocalFallback = !API_BASE_URL;
  const heroContent = homeData?.hero ?? (isLocalFallback ? FALLBACK_HERO : undefined);

  return (
    <>
      {isError ? (
        <div role="alert" className="notice-banner paragraph-small">
          We’re refreshing live availability. Please try again shortly.
        </div>
      ) : null}
      {heroContent ? (
        <Hero
          headline={heroContent.headline}
          subheadline={heroContent.subheadline}
          tagline={heroContent.tagline}
          cta={heroContent.cta}
          consultationCta={heroContent.consultationCta}
          image={heroContent.image}
          isLoading={isPending}
        />
      ) : null}
      <AboutBlurb />
      <FeaturedServices services={homeData?.featuredServices ?? []} isLoading={isPending} />
      <FeaturedProducts products={homeData?.featuredProducts ?? []} isLoading={isPending} />
      {homeData?.location ? <LocationSpotlight location={homeData.location} /> : null}
      {homeData?.community ? <Community links={homeData.community} /> : null}
    </>
  );
}

export default Home;
