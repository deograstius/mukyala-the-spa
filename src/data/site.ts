import type { SiteMeta } from '../types/data';

export const site: SiteMeta = {
  name: 'Mukyala Day Spa',
  logo: {
    main: '/images/mukyala_logo.png',
    altText: 'Mukyala Day Spa Logo',
  },
  seoTitlePattern: '${page} – ${site.name}',
};

export function formatTitle(page: string): string {
  return `${page} – ${site.name}`;
}
