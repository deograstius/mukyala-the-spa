import { setPageMeta } from '@app/seo';
import Community from '@features/home/Community';
import ProductGrid from '@features/shop/ProductGrid';
import { reportCatalogUnavailable, SOLD_OUT_MESSAGE } from '@features/shop/catalogFallback';
import { useProductsQuery } from '@hooks/catalog.api';
import HeroSection from '@shared/sections/HeroSection';
import { useEffect, useMemo } from 'react';
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
  let groups = [...byKey.values()].sort(
    (a, b) => a.position - b.position || (a.heading ?? '').localeCompare(b.heading ?? ''),
  );
  // Sparse-catalog guard: a 1-item category renders as a heading + one lonely
  // card, so fold single-item categories into the trailing unlabeled bucket
  // until they have enough items to stand alone.
  const sparse = groups.filter((g) => g.heading !== null && g.items.length < 2);
  if (sparse.length > 0) {
    let rest = byKey.get('');
    if (!rest) {
      rest = { key: 'more', heading: null, position: Number.MAX_SAFE_INTEGER, items: [] };
    }
    for (const g of sparse) rest.items.push(...g.items);
    groups = [...groups.filter((g) => !sparse.includes(g) && g !== rest), rest];
  }
  // Only label the uncategorized bucket when it sits alongside real sections.
  if (groups.length > 1) {
    for (const g of groups) if (g.heading === null) g.heading = 'More';
  }
  return groups;
}

export default function Shop() {
  useEffect(() => {
    setPageMeta(
      'Shop',
      'Shop spa-tested skincare from Mukyala Day Spa in Carlsbad — cleansers, masks, and treatment-grade products curated by licensed estheticians.',
      '/shop',
    );
  }, []);
  const { data: products, isLoading, isError, error } = useProductsQuery();
  const groups = useMemo(() => groupByCategory(products ?? []), [products]);
  // One catalog fallback (spec #27): empty catalog and API-down render the
  // same sold-out line; only the down-case logs + emits telemetry.
  useEffect(() => {
    if (isError) reportCatalogUnavailable('shop', error);
  }, [isError, error]);
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
        <div className="mg-top-64px">
          {isLoading && (
            <div role="status" aria-busy="true" className="empty-state w-dyn-empty">
              <div>Loading products…</div>
            </div>
          )}
          {!isLoading && (isError || groups.length === 0) && (
            <div role="status" className="empty-state">
              <p className="paragraph-large">{SOLD_OUT_MESSAGE}</p>
            </div>
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

      {/* Page-end pattern matches Services: close with the community strip. */}
      <Community />
    </>
  );
}
