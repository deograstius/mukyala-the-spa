import ProductGrid from '../components/shop/ProductGrid';
import Container from '../components/ui/Container';
import Section from '../components/ui/Section';
import { shopProducts } from '../data/products';

export default function Shop() {
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
