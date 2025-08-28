export interface Product {
  slug?: string;
  title: string;
  priceCents: number;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  href: string;
}
