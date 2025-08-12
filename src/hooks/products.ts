import { useMemo } from 'react';
import { shopProducts } from '../data/products';
import type { Product } from '../types/product';

function slugFromHref(href: string): string {
  const parts = href.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export function useProducts(): Product[] {
  // Static for now; memoized to keep reference stable across renders.
  return useMemo(() => shopProducts, []);
}

export function useProductBySlug(slug: string | undefined): Product | undefined {
  const products = useProducts();
  return useMemo(() => {
    if (!slug) return undefined;
    return products.find((p) => slugFromHref(p.href) === slug);
  }, [products, slug]);
}

export function getSlugFromHref(href: string): string {
  return slugFromHref(href);
}
