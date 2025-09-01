import { setBaseTitle } from '@app/seo';
import ProductGrid from '@features/shop/ProductGrid';
import HeroSection from '@shared/sections/HeroSection';
import Reveal, { RevealStagger } from '@shared/ui/Reveal';
// Container/Section not needed; HeroSection wraps layout
import { shopProducts } from '../data/products';

export default function Shop() {
  setBaseTitle('Shop');
  return (
    <>
      <HeroSection variant="content-only" sectionClassName="hero v7">
        <RevealStagger>
          <div className="inner-container _580px center">
            <div className="text-center">
              <Reveal>
                <h1 className="display-11">Shop</h1>
              </Reveal>
              <Reveal>
                <div className="mg-top-16px">
                  <p className="paragraph-large">
                    Curated skincare essentials to support your routine — thoughtfully selected and
                    spa‑tested by our team.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
          <div className="mg-top-60px">
            <ProductGrid products={shopProducts} />
          </div>
        </RevealStagger>
      </HeroSection>
    </>
  );
}
