import type { ServiceItem } from '../types/service';

export const services: ServiceItem[] = [
  {
    slug: 'baobab-glow-facial',
    title: 'Baobab Glow Facial',
    image: '/images/baobab-glow-facial.jpg',
    imageSrcSet:
      '/images/baobab-glow-facial-p-500.jpg 500w, /images/baobab-glow-facial-p-800.jpg 800w, /images/baobab-glow-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/baobab-glow-facial',
    description:
      'A brightening facial featuring antioxidant-rich baobab to restore glow and even tone. Ideal for dull or fatigued skin.',
    duration: '60 min',
    priceCents: 9500,
  },
  {
    slug: 'kalahari-melon-hydration-facial',
    title: 'Kalahari Melon Hydration Facial',
    image: '/images/kalahari-melon-hydration-facial.jpg',
    imageSrcSet:
      '/images/kalahari-melon-hydration-facial-p-500.jpg 500w, /images/kalahari-melon-hydration-facial-p-800.jpg 800w, /images/kalahari-melon-hydration-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/kalahari-melon-hydration-facial',
    description:
      'Deep hydration with Kalahari melon to plump and replenish the skin barrier. Perfect for dry or stressed skin.',
    duration: '60 min',
    priceCents: 10500,
  },
  {
    slug: 'rooibos-radiance-facial',
    title: 'Rooibos Radiance Facial',
    image: '/images/rooibos-radiance-facial.jpg',
    imageSrcSet:
      '/images/rooibos-radiance-facial-p-500.jpg 500w, /images/rooibos-radiance-facial-p-800.jpg 800w, /images/rooibos-radiance-facial.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/rooibos-radiance-facial',
    description:
      'Antioxidant-forward treatment powered by rooibos to calm, defend and reveal a luminous complexion.',
    duration: '45 min',
    priceCents: 8500,
  },
  {
    slug: 'shea-gold-collagen-lift',
    title: 'Shea Gold Collagen Lift',
    image: '/images/shea-gold-collagen-lift.jpg',
    imageSrcSet:
      '/images/shea-gold-collagen-lift-p-500.jpg 500w, /images/shea-gold-collagen-lift-p-800.jpg 800w, /images/shea-gold-collagen-lift.jpg 1024w',
    imageSizes: '(max-width: 991px) 100vw, (max-width: 1439px) 49vw, 580px',
    href: '/services/shea-gold-collagen-lift',
    description:
      'A firming ritual with shea and peptide support to visibly lift and smooth texture for a youthful glow.',
    duration: '75 min',
    priceCents: 12500,
  },
];
