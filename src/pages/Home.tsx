import Footer from '../components/Footer';
import Header from '../components/Header';
import CtaBanner from '../components/sections/CtaBanner';
import Hero from '../components/sections/Hero';
import ServicesGrid from '../components/sections/ServicesGrid';

function Home() {
  return (
    <>
      <Header />
      <Hero />
      <ServicesGrid />
      <CtaBanner />
      <Footer />
    </>
  );
}

export default Home;
