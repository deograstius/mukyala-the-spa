export interface Product {
  sku?: string;
  slug?: string;
  title: string;
  priceCents: number;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  href: string;
}
