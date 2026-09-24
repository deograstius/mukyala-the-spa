import type { SiteMeta } from '../types/data';

export const site: SiteMeta = {
  name: 'Mukyala The Spa',
  logo: {
    main: '/images/mukyala_logo.png',
    altText: 'Mukyala The Spa Logo',
  },
  seoTitlePattern: '${page} | ${site.name}',
};

export function formatTitle(page: string): string {
  return `${page} | ${site.name}`;
}
