import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@utils/api';
import type { Product } from '@types/product';
import type { ServiceItem } from '@types/service';
import type { Location } from '@types/data';

type ApiService = {
  slug: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  priceCents?: number;
  image?: string;
  imageSrcSet?: string;
  imageSizes?: string;
  active?: boolean;
};

type ApiProduct = {
  slug: string;
  title: string;
  priceCents: number;
  image?: string;
  imageSrcSet?: string;
  imageSizes?: string;
  active?: boolean;
};

export function useServicesQuery() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async (): Promise<ServiceItem[]> => {
      const services = await apiGet<ApiService[]>('/v1/services');
      return (services || []).map((s) => ({
        slug: s.slug,
        title: s.title,
        href: `/services/${s.slug}`,
        image: s.image || '',
        imageSrcSet: s.imageSrcSet,
        imageSizes: s.imageSizes,
        description: s.description,
        duration: s.durationMinutes ? `${s.durationMinutes} min` : undefined,
        priceCents: s.priceCents,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductsQuery() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const products = await apiGet<ApiProduct[]>('/v1/products');
      return (products || []).map((p) => ({
        slug: p.slug,
        title: p.title,
        priceCents: p.priceCents,
        image: p.image || '',
        imageSrcSet: p.imageSrcSet,
        imageSizes: p.imageSizes,
        href: `/shop/${p.slug}`,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocationsQuery() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const locs = await apiGet<any[]>('/v1/locations');
      // Adapt OpenAPI Location to SPA Location type
      return (locs || []).map((l) => ({
        id: l.id,
        name: l.name,
        address: {
          line1: l.address?.line1 || '',
          city: l.address?.city || '',
          state: l.address?.state || '',
          postalCode: l.address?.postalCode || '',
          country: l.address?.country || 'US',
        },
        mapUrl: l.mapUrl || '',
        phone: { tel: l.phoneE164 || '', display: l.phoneDisplay || '' },
        email: l.email || '',
        timezone: l.timezone || 'America/Los_Angeles',
        hoursByDay: l.hoursByDay || {},
      }));
    },
    staleTime: 10 * 60 * 1000,
  });
}

