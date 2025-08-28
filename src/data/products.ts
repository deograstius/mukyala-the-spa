import type { Product } from '../types/product';

// Initial seed data derived from Webflow export (../mukyala) and
// existing images under public/images. These mirror the items used
// in FeaturedProducts and can be expanded later.
export const shopProducts: Product[] = [
  {
    slug: 'baobab-peptide-glow-drops',
    title: 'Baobab & Peptide Glow Drops · 30 ml',
    priceCents: 3200,
    image: '/images/baobab-peptide-glow-drops.jpg',
    imageSrcSet:
      '/images/baobab-peptide-glow-drops-p-500.jpg 500w, /images/baobab-peptide-glow-drops-p-800.jpg 800w, /images/baobab-peptide-glow-drops.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
    href: '/shop/baobab-peptide-glow-drops',
  },
  {
    slug: 'kalahari-hydration-jelly-pod-duo',
    title: 'Kalahari Hydration Jelly Pod Duo',
    priceCents: 1400,
    image: '/images/kalahari-hydration-jelly-pod-duo.jpg',
    imageSrcSet:
      '/images/kalahari-hydration-jelly-pod-duo-p-500.jpg 500w, /images/kalahari-hydration-jelly-pod-duo-p-800.jpg 800w, /images/kalahari-hydration-jelly-pod-duo.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
    href: '/shop/kalahari-hydration-jelly-pod-duo',
  },
  {
    slug: 'rooibos-radiance-antioxidant-mist',
    title: 'Rooibos Radiance Antioxidant Mist · 50 ml',
    priceCents: 1900,
    image: '/images/rooibos-radiance-antioxidant-mist.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-antioxidant-mist-p-500.jpg 500w, /images/rooibos-radiance-antioxidant-mist-p-800.jpg 800w, /images/rooibos-radiance-antioxidant-mist.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
    href: '/shop/rooibos-radiance-antioxidant-mist',
  },
  {
    slug: 'shea-gold-overnight-renewal-balm',
    title: 'Shea Gold Overnight Renewal Balm · 20 g',
    priceCents: 3800,
    image: '/images/shea-gold-overnight-renewal-balm.jpg',
    imageSrcSet:
      '/images/shea-gold-overnight-renewal-balm-p-500.jpg 500w, /images/shea-gold-overnight-renewal-balm-p-800.jpg 800w, /images/shea-gold-overnight-renewal-balm.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
    href: '/shop/shea-gold-overnight-renewal-balm',
  },
  // Optional additional items to round out the grid using available assets
  {
    slug: 'rooibos-radiance-facial-gift',
    title: 'Rooibos Radiance Facial · Gift Set',
    priceCents: 4500,
    image: '/images/rooibos-radiance-facial.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-facial-p-500.jpg 500w, /images/rooibos-radiance-facial-p-800.jpg 800w, /images/rooibos-radiance-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
    href: '/shop/rooibos-radiance-facial-gift',
  },
  {
    slug: 'shea-gold-collagen-lift-duo',
    title: 'Shea Gold Collagen Lift · Duo',
    priceCents: 5400,
    image: '/images/shea-gold-collagen-lift.jpg',
    imageSrcSet:
      '/images/shea-gold-collagen-lift-p-500.jpg 500w, /images/shea-gold-collagen-lift-p-800.jpg 800w, /images/shea-gold-collagen-lift.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 33vw, 440px',
    href: '/shop/shea-gold-collagen-lift-duo',
  },
];
