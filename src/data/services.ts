import type { ServiceItem } from '../types/service';

export const services: ServiceItem[] = [
  {
    slug: 'so-africal-facial',
    title: 'So AfriCal Facial',
    image: '/images/so-africal-facial.jpg',
    imageSrcSet:
      '/images/so-africal-facial-p-500.jpg 500w, /images/so-africal-facial-p-800.jpg 800w, /images/so-africal-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/so-africal-facial',
    description:
      'Includes a skin assessment and a consultation-guided facial customized to your needs. Combines traditional remedies with advanced technologies like LED and microdermabrasion, plus an at-home plan to maintain results.',
    duration: '60 min',
    priceCents: 40000,
  },
  {
    slug: 'hydrafacial',
    title: 'HydraFacial',
    image: '/images/kalahari-melon-hydration-facial.jpg',
    imageSrcSet:
      '/images/kalahari-melon-hydration-facial-p-500.jpg 500w, /images/kalahari-melon-hydration-facial-p-800.jpg 800w, /images/kalahari-melon-hydration-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/hydrafacial',
    description:
      'Multi-step cleanse and gentle exfoliation, followed by extraction and hydration with targeted serums.',
    duration: '60 min',
    priceCents: 25000,
  },
  {
    slug: 'microcurrent-facial',
    title: 'Microcurrent Facial',
    image: '/images/rooibos-radiance-facial.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-facial-p-500.jpg 500w, /images/rooibos-radiance-facial-p-800.jpg 800w, /images/rooibos-radiance-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/microcurrent-facial',
    description:
      'A low-level current treatment designed to support a lifted, sculpted look with no downtime.',
    duration: '60 min',
    priceCents: 17500,
  },
  {
    slug: 'dermaplaning-facial',
    title: 'Dermaplaning Facial',
    image: '/images/baobab-glow-facial.jpg',
    imageSrcSet:
      '/images/baobab-glow-facial-p-500.jpg 500w, /images/baobab-glow-facial-p-800.jpg 800w, /images/baobab-glow-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/dermaplaning-facial',
    description:
      'Precise exfoliation that removes dead skin and peach fuzz for a smoother finish and brighter look.',
    duration: '50 min',
    priceCents: 17500,
  },
  {
    slug: 'chemical-peel',
    title: 'Chemical Peel (Light)',
    image: '/images/so-africal-facial.jpg',
    imageSrcSet:
      '/images/so-africal-facial-p-500.jpg 500w, /images/so-africal-facial-p-800.jpg 800w, /images/so-africal-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/chemical-peel',
    description:
      'A light peel to refresh the look of tone and texture with a smooth, luminous finish.',
    duration: '45 min',
    priceCents: 13000,
  },
  {
    slug: 'lash-extensions',
    title: 'Lash Extensions (Full Set)',
    image: '/images/close-up-of-cosmetic-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/close-up-of-cosmetic-hair-x-webflow-template-p-500.jpg 500w, /images/close-up-of-cosmetic-hair-x-webflow-template-p-800.jpg 800w, /images/close-up-of-cosmetic-hair-x-webflow-template.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/lash-extensions',
    description:
      'Semi-permanent extensions applied lash-by-lash for length, definition, and fullness.',
    duration: '150 min',
    priceCents: 18500,
  },
  {
    slug: 'brow-lamination',
    title: 'Brow Lamination',
    image: '/images/brown-makeup-brush-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/brown-makeup-brush-hair-x-webflow-template-p-500.jpg 500w, /images/brown-makeup-brush-hair-x-webflow-template-p-800.jpg 800w, /images/brown-makeup-brush-hair-x-webflow-template.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/brow-lamination',
    description: 'A brow “set” that smooths and shapes hairs into a fuller, brushed-up look.',
    duration: '45 min',
    priceCents: 9000,
  },
  {
    slug: 'full-body-wax',
    title: 'Full Body Wax',
    image: '/images/beauty-and-wellness-hero-hair-x-webflow-template.jpg',
    imageSrcSet:
      '/images/beauty-and-wellness-hero-hair-x-webflow-template-p-500.jpg 500w, /images/beauty-and-wellness-hero-hair-x-webflow-template-p-800.jpg 800w, /images/beauty-and-wellness-hero-hair-x-webflow-template.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/full-body-wax',
    description: 'Smooth, longer-lasting hair removal across multiple areas in one appointment.',
    duration: '120 min',
    priceCents: 38000,
  },
];
