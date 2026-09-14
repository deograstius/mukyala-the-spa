export interface Product {
  sku?: string;
  slug?: string;
  title: string;
  priceCents: number;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  href: string;
  // The catalog API only returns active rows; false can still appear from
  // cached payloads, so treat anything but `false` as purchasable.
  active?: boolean;
  // Staff-assigned grouping; shop renders one section per category.
  category?: { slug: string; title: string; position: number } | null;
}
