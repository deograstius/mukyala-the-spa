import AboutBlurb from '@features/home/AboutBlurb';
import Community from '@features/home/Community';
import FeaturedProducts from '@features/home/FeaturedProducts';
import Hero from '@features/home/Hero';
import LocationSpotlight from '@features/home/LocationSpotlight';
import ServicesGrid from '@features/services/ServicesGrid';

function Home() {
  return (
    <>
      <Hero />
      <AboutBlurb />
      <ServicesGrid />
      {/* Featured products slider */}
      <FeaturedProducts />
      {/* Location spotlight */}
      <LocationSpotlight />
      <Community />
    </>
  );
}

export default Home;
