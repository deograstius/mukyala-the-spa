import AboutBlurb from '../components/sections/AboutBlurb';
import BrandsStrip from '../components/sections/BrandsStrip';
import Community from '../components/sections/Community';
import CtaBanner from '../components/sections/CtaBanner';
import FeaturedProducts from '../components/sections/FeaturedProducts';
import Hero from '../components/sections/Hero';
import LocationSpotlight from '../components/sections/LocationSpotlight';
import ServicesGrid from '../components/sections/ServicesGrid';

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
      <BrandsStrip />
      <Community />
      <CtaBanner />
    </>
  );
}

export default Home;
