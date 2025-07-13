import Footer from '../components/Footer';
import Header from '../components/Header';
import AboutBlurb from '../components/sections/AboutBlurb';
import BrandsStrip from '../components/sections/BrandsStrip';
import CtaBanner from '../components/sections/CtaBanner';
import Hero from '../components/sections/Hero';
import ServicesGrid from '../components/sections/ServicesGrid';

function Home() {
  return (
    <>
      <Header />
      <Hero />
      <AboutBlurb />
      <ServicesGrid />
      <BrandsStrip />
      <CtaBanner />
      <Footer />
    </>
  );
}

export default Home;
