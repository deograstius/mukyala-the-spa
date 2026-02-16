import { setBaseTitle } from '@app/seo';
import ProductGrid from '@features/shop/ProductGrid';
import { useProductsQuery } from '@hooks/catalog.api';
import HeroSection from '@shared/sections/HeroSection';
// Container/Section not needed; HeroSection wraps layout

export default function Shop() {
  setBaseTitle('Shop');
  const { data: products, isLoading, isError } = useProductsQuery();
  return (
    <>
      <HeroSection variant="content-only" sectionClassName="hero v7 hero-pad-bottom-xl">
        <div className="inner-container _580px center">
          <div className="text-center">
            <h1 className="display-11">Shop</h1>
            <div className="mg-top-16px">
              <p className="paragraph-large">
                Curated skincare essentials to support your routine. Thoughtfully selected and
                spa-tested by our team.
              </p>
            </div>
          </div>
        </div>
        <div className="mg-top-60px">
          {isLoading && <div>Loading products…</div>}
          {isError && <div role="alert">Failed to load products.</div>}
          {!isLoading && !isError && products && <ProductGrid products={products} />}
        </div>
      </HeroSection>
    </>
  );
}
