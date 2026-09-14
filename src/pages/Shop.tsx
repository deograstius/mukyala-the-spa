import { setBaseTitle } from '@app/seo';
import ProductGrid from '@features/shop/ProductGrid';
import { useProductsQuery } from '@hooks/catalog.api';
import HeroSection from '@shared/sections/HeroSection';
import { useMemo } from 'react';
import type { Product } from '../types/product';
// Container/Section not needed; HeroSection wraps layout

type ProductGroup = { key: string; heading: string | null; position: number; items: Product[] };

/**
 * Group products by their staff-assigned category, ordered by category
 * position; uncategorized products land in a trailing "More" section. When no
 * product has a category the shop renders the single flat grid it always has.
 */
function groupByCategory(products: Product[]): ProductGroup[] {
  const byKey = new Map<string, ProductGroup>();
  for (const p of products) {
    const key = p.category?.slug ?? '';
    let group = byKey.get(key);
    if (!group) {
      group = {
        key: key || 'more',
        heading: p.category?.title ?? null,
        position: p.category?.position ?? Number.MAX_SAFE_INTEGER,
        items: [],
      };
      byKey.set(key, group);
    }
    group.items.push(p);
  }
  const groups = [...byKey.values()].sort(
    (a, b) => a.position - b.position || (a.heading ?? '').localeCompare(b.heading ?? ''),
  );
  // Only label the uncategorized bucket when it sits alongside real sections.
  if (groups.length > 1) {
    for (const g of groups) if (g.heading === null) g.heading = 'More';
  }
  return groups;
}

export default function Shop() {
  setBaseTitle('Shop');
  const { data: products, isLoading, isError } = useProductsQuery();
  const groups = useMemo(() => groupByCategory(products ?? []), [products]);
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
          {!isLoading && !isError && products && groups.length === 0 && (
            <ProductGrid products={[]} />
          )}
          {!isLoading &&
            !isError &&
            groups.map((group) => (
              <div key={group.key}>
                {group.heading ? (
                  <div className="text-center mg-bottom-32px">
                    <h2 className="display-8">{group.heading}</h2>
                  </div>
                ) : null}
                <div className={group === groups[groups.length - 1] ? '' : 'mg-bottom-60px'}>
                  <ProductGrid products={group.items} />
                </div>
              </div>
            ))}
        </div>
      </HeroSection>
    </>
  );
}
