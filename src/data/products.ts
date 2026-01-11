import type { Product } from '../types/product';

// Initial seed data derived from Webflow export (../mukyala) and
// existing images under public/images. These mirror the items used
// in FeaturedProducts and can be expanded later.
export const shopProducts: Product[] = [
  {
    sku: 'MK-B5HS-30ML',
    slug: 'b5-hydrating-serum',
    title: 'DermaQuest B5 Hydrating Serum',
    priceCents: 6800,
    image: '/images/dermaquest-b5-hydrating-serum.jpg',
    imageSrcSet:
      '/images/dermaquest-b5-hydrating-serum-p-500.jpg 500w, /images/dermaquest-b5-hydrating-serum-p-800.jpg 800w, /images/dermaquest-b5-hydrating-serum.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/b5-hydrating-serum',
  },
  {
    sku: 'MK-GRC-177ML',
    slug: 'glyco-resurfacing-cleanser',
    title: 'DermaQuest Glyco Resurfacing Cleanser',
    priceCents: 3800,
    image: '/images/dermaquest-glyco-resurfacing-cleanser.jpg',
    imageSrcSet:
      '/images/dermaquest-glyco-resurfacing-cleanser-p-500.jpg 500w, /images/dermaquest-glyco-resurfacing-cleanser-p-800.jpg 800w, /images/dermaquest-glyco-resurfacing-cleanser.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/glyco-resurfacing-cleanser',
  },
  {
    sku: 'MK-SZNC-60ML',
    slug: 'sheerzinc-spf-30',
    title: 'DermaQuest SheerZinc SPF 30',
    priceCents: 5800,
    image: '/images/dermaquest-sheerzinc-spf-30.jpg',
    imageSrcSet:
      '/images/dermaquest-sheerzinc-spf-30-p-500.jpg 500w, /images/dermaquest-sheerzinc-spf-30-p-800.jpg 800w, /images/dermaquest-sheerzinc-spf-30.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/sheerzinc-spf-30',
  },
  {
    sku: 'MK-UCO-177ML',
    slug: 'universal-cleansing-oil',
    title: 'DermaQuest Universal Cleansing Oil',
    priceCents: 3600,
    image: '/images/dermaquest-universal-cleansing-oil.jpg',
    imageSrcSet:
      '/images/dermaquest-universal-cleansing-oil-p-500.jpg 500w, /images/dermaquest-universal-cleansing-oil-p-800.jpg 800w, /images/dermaquest-universal-cleansing-oil.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/universal-cleansing-oil',
  },
  {
    sku: 'MK-GLUT-30OZ',
    slug: 'glutathione-hydrojelly-mask',
    title: 'Glutathione HydroJelly Mask (Esthemax)',
    priceCents: 8000,
    image: '/images/esthemax-glutathione-hydrojelly-mask.jpg',
    imageSrcSet:
      '/images/esthemax-glutathione-hydrojelly-mask-p-500.jpg 500w, /images/esthemax-glutathione-hydrojelly-mask-p-800.jpg 800w, /images/esthemax-glutathione-hydrojelly-mask.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/glutathione-hydrojelly-mask',
  },
  {
    sku: 'MK-HYAL-30OZ',
    slug: 'hyaluronic-acid-hydrojelly-mask',
    title: 'Hyaluronic Acid HydroJelly Mask (Esthemax)',
    priceCents: 8000,
    image: '/images/esthemax-hyaluronic-acid-hydrojelly-mask.jpg',
    imageSrcSet:
      '/images/esthemax-hyaluronic-acid-hydrojelly-mask-p-500.jpg 500w, /images/esthemax-hyaluronic-acid-hydrojelly-mask-p-800.jpg 800w, /images/esthemax-hyaluronic-acid-hydrojelly-mask.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/hyaluronic-acid-hydrojelly-mask',
  },
  {
    sku: 'MK-CHAR-30OZ',
    slug: 'purifying-charcoal-hydrojelly-mask',
    title: 'Purifying Charcoal HydroJelly Mask (Esthemax)',
    priceCents: 8000,
    image: '/images/esthemax-purifying-charcoal-hydrojelly-mask.jpg',
    imageSrcSet:
      '/images/esthemax-purifying-charcoal-hydrojelly-mask-p-500.jpg 500w, /images/esthemax-purifying-charcoal-hydrojelly-mask-p-800.jpg 800w, /images/esthemax-purifying-charcoal-hydrojelly-mask.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/purifying-charcoal-hydrojelly-mask',
  },
  {
    sku: 'MK-SEAM-30OZ',
    slug: 'wildcrafted-sea-moss-hydrojelly-mask',
    title: 'Wildcrafted Sea Moss HydroJelly Mask (Esthemax)',
    priceCents: 8000,
    image: '/images/esthemax-wildcrafted-sea-moss-hydrojelly-mask.jpg',
    imageSrcSet:
      '/images/esthemax-wildcrafted-sea-moss-hydrojelly-mask-p-500.jpg 500w, /images/esthemax-wildcrafted-sea-moss-hydrojelly-mask-p-800.jpg 800w, /images/esthemax-wildcrafted-sea-moss-hydrojelly-mask.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/shop/wildcrafted-sea-moss-hydrojelly-mask',
  },
];
