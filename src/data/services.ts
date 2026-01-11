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
];
