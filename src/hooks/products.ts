import { useMemo } from 'react';
import { shopProducts } from '../data/products';
import type { Product } from '../types/product';
import { getSlugFromHref } from '../utils/slug';

export function useProducts(): Product[] {
  // Static for now; memoized to keep reference stable across renders.
  return useMemo(() => shopProducts, []);
}

export function useProductBySlug(slug: string | undefined): Product | undefined {
  const products = useProducts();
  return useMemo(() => {
    if (!slug) return undefined;
    return products.find((p) => getSlugFromHref(p.href) === slug);
  }, [products, slug]);
}
