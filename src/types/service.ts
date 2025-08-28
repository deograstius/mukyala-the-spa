export interface ServiceItem {
  title: string;
  href: string;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  description?: string;
  duration?: string; // e.g., "60 min"
  priceCents?: number; // e.g., 9500 for $95.00
}
