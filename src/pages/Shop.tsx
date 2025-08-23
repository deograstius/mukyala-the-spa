import { setBaseTitle } from '@app/seo';
import ProductGrid from '@features/shop/ProductGrid';
import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import { shopProducts } from '../data/products';

export default function Shop() {
  setBaseTitle('Shop');
  return (
    <>
      <Section className="hero v7">
        <Container>
          <div className="inner-container _580px center">
            <div className="text-center">
              <h1 className="display-11">Shop</h1>
              <div className="mg-top-16px">
                <p className="paragraph-large">
                  Curated skincare essentials to support your routine — thoughtfully selected and
                  spa‑tested by our team.
                </p>
              </div>
            </div>
          </div>
          <div className="mg-top-60px">
            <ProductGrid products={shopProducts} />
          </div>
        </Container>
      </Section>
    </>
  );
}
