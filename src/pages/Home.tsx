import AboutBlurb from '../components/sections/AboutBlurb';
import BrandsStrip from '../components/sections/BrandsStrip';
import Community from '../components/sections/Community';
import CtaBanner from '../components/sections/CtaBanner';
import Hero from '../components/sections/Hero';
import ServicesGrid from '../components/sections/ServicesGrid';

function Home() {
  return (
    <>
      <Hero />
      <AboutBlurb />
      <ServicesGrid />
      <BrandsStrip />
      <Community />
      <CtaBanner />
    </>
  );
}

export default Home;
