/** One entry of a product's ordered image list (#33) — cover first. */
export interface ProductImage {
  src: string;
  srcSet?: string | null;
  sizes?: string | null;
}

export interface Product {
  sku?: string;
  slug?: string;
  title: string;
  priceCents: number;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  /** Ordered image list (#33): cover first, then curated additional shots.
   *  The detail-page carousel walks this; absent from older API payloads. */
  images?: ProductImage[];
  href: string;
  // The catalog API only returns active rows; false can still appear from
  // cached payloads, so treat anything but `false` as purchasable.
  active?: boolean;
  // Staff-assigned grouping; shop renders one section per category.
  category?: { slug: string; title: string; position: number } | null;
  // Shown on the product page; imported from the barcode DB at scan time.
  description?: string | null;
}
