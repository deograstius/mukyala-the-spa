export interface ServiceItem {
  title: string;
  href: string;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  description?: string;
  duration?: string; // e.g., "60 min"
  price?: string; // e.g., "$95"
}
