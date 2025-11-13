import { primaryLocation } from '@data/contact';
import { featuredProductSlugs, featuredServiceSlugs } from '@data/featured';
import { shopProducts } from '@data/products';
import { services as fallbackServices } from '@data/services';
import { socialLinks } from '@data/social';
import { useQuery } from '@tanstack/react-query';
import type { Location, SocialLink, HoursByDay } from '@types/data';
import type { Product } from '@types/product';
import type { ServiceItem } from '@types/service';
import { apiGet } from '@utils/api';

type ApiHeroImage = {
  src?: string;
  srcSet?: string;
  sizes?: string;
};

type ApiHero = {
  headline?: string;
  subheadline?: string;
  cta?: {
    label?: string;
    href?: string;
  };
  image?: ApiHeroImage | null;
};

type ApiService = {
  slug: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  priceCents?: number;
  image?: string;
  imageSrcSet?: string;
  imageSizes?: string;
};

type ApiProduct = {
  slug: string;
  title: string;
  priceCents: number;
  image?: string;
  imageSrcSet?: string;
  imageSizes?: string;
  sku?: string;
};

type ApiLocation = {
  id: string;
  name: string;
  timezone?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  mapUrl?: string;
  phoneDisplay?: string;
  phoneE164?: string;
  email?: string;
  hoursByDay?: Location['hoursByDay'];
};

type ApiCommunityLink = {
  key: string;
  label: string;
  url: string;
  icon: string;
};

type ApiHomeResponse = {
  hero?: ApiHero | null;
  featuredServices?: ApiService[];
  featuredProducts?: ApiProduct[];
  location?: ApiLocation;
  community?: ApiCommunityLink[];
};

export type HomeHero = {
  headline: string;
  subheadline?: string;
  cta: {
    label: string;
    href: string;
  };
  image: {
    src: string;
    srcSet?: string;
    sizes?: string;
  };
};

export type HomePayload = {
  hero: HomeHero;
  featuredServices: ServiceItem[];
  featuredProducts: Product[];
  location: Location;
  community: SocialLink[];
};

export const FALLBACK_HERO: HomeHero = {
  headline: 'Experience beauty and wellness like never before',
  subheadline: 'Timeless rituals, inclusive care.',
  cta: {
    label: 'Make a reservation',
    href: '/reservation',
  },
  image: {
    src: '/images/home-hero.jpg',
    srcSet:
      '/images/home-hero-p-500.jpg 500w, /images/home-hero-p-800.jpg 800w, /images/home-hero-p-1080.jpg 1080w, /images/home-hero-p-1600.jpg 1600w, /images/home-hero.jpg 2580w',
    sizes: '(max-width: 991px) 100vw, 100vw',
  },
};

const fallbackServiceMap = new Map(fallbackServices.map((svc) => [svc.slug, svc]));
const fallbackProductMap = new Map(shopProducts.map((product) => [product.slug, product]));

function mapService(api: ApiService): ServiceItem {
  const fallback = fallbackServiceMap.get(api.slug);
  return {
    slug: api.slug,
    title: api.title,
    href: `/services/${api.slug}`,
    image: api.image || fallback?.image || FALLBACK_HERO.image.src,
    imageSrcSet: api.imageSrcSet || fallback?.imageSrcSet,
    imageSizes: api.imageSizes || fallback?.imageSizes,
    description: api.description || fallback?.description,
    duration: api.durationMinutes ? `${api.durationMinutes} min` : fallback?.duration,
    priceCents: api.priceCents ?? fallback?.priceCents,
  };
}

function mapProduct(api: ApiProduct): Product {
  const fallback = fallbackProductMap.get(api.slug);
  return {
    sku: api.sku,
    slug: api.slug,
    title: api.title,
    priceCents: api.priceCents,
    image: api.image || fallback?.image || FALLBACK_HERO.image.src,
    imageSrcSet: api.imageSrcSet || fallback?.imageSrcSet,
    imageSizes: api.imageSizes || fallback?.imageSizes,
    href: `/shop/${api.slug}`,
  };
}

function cloneHours(hours: HoursByDay): HoursByDay {
  const cloned = Object.entries(hours || {}).reduce<
    Record<string, { open: string; close: string }[]>
  >((acc, [day, ranges]) => {
    acc[day] = Array.isArray(ranges) ? ranges.map((range) => ({ ...range })) : [];
    return acc;
  }, {});
  return cloned as HoursByDay;
}

function cloneLocation(loc: Location): Location {
  return {
    ...loc,
    address: { ...loc.address },
    phone: { ...loc.phone },
    hoursByDay: cloneHours(loc.hoursByDay),
  };
}

function mapLocation(api?: ApiLocation): Location {
  if (!api) return cloneLocation(primaryLocation);
  return {
    id: api.id,
    name: api.name,
    address: {
      line1: api.address?.line1 || primaryLocation.address.line1,
      city: api.address?.city || primaryLocation.address.city,
      state: api.address?.state || primaryLocation.address.state,
      postalCode: api.address?.postalCode || primaryLocation.address.postalCode,
      country: api.address?.country || primaryLocation.address.country,
    },
    mapUrl: api.mapUrl || primaryLocation.mapUrl,
    phone: {
      tel: api.phoneE164 || primaryLocation.phone.tel,
      display: api.phoneDisplay || primaryLocation.phone.display,
    },
    email: api.email || primaryLocation.email,
    timezone: api.timezone || primaryLocation.timezone,
    hoursByDay: api.hoursByDay
      ? cloneHours(api.hoursByDay)
      : cloneHours(primaryLocation.hoursByDay),
    weekdayHours: primaryLocation.weekdayHours,
    weekendHours: primaryLocation.weekendHours,
  };
}

function mapHero(api?: ApiHero | null): HomeHero {
  if (!api) return FALLBACK_HERO;
  return {
    headline: api.headline || FALLBACK_HERO.headline,
    subheadline: api.subheadline ?? FALLBACK_HERO.subheadline,
    cta: {
      label: api.cta?.label || FALLBACK_HERO.cta.label,
      href: api.cta?.href || FALLBACK_HERO.cta.href,
    },
    image: {
      src: api.image?.src || FALLBACK_HERO.image.src,
      srcSet: api.image?.srcSet || FALLBACK_HERO.image.srcSet,
      sizes: api.image?.sizes || FALLBACK_HERO.image.sizes,
    },
  };
}

function mapCommunity(links?: ApiCommunityLink[]): SocialLink[] {
  const resolved = (links || []).map((link) => ({
    key: link.key,
    label: link.label,
    url: link.url,
    icon: link.icon,
  }));
  return resolved.length ? resolved : socialLinks;
}

function selectFallbackServices(): ServiceItem[] {
  return featuredServiceSlugs
    .map((slug) => fallbackServices.find((svc) => svc.slug === slug))
    .filter((svc): svc is ServiceItem => Boolean(svc))
    .map((svc) => ({ ...svc }));
}

function selectFallbackProducts(): Product[] {
  return featuredProductSlugs
    .map((slug) => shopProducts.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product))
    .map((product) => ({ ...product }));
}

export function buildFallbackHomeData(): HomePayload {
  return {
    hero: FALLBACK_HERO,
    featuredServices: selectFallbackServices(),
    featuredProducts: selectFallbackProducts(),
    location: cloneLocation(primaryLocation),
    community: socialLinks,
  };
}

function transformResponse(payload?: ApiHomeResponse | null): HomePayload {
  const fallback = buildFallbackHomeData();
  const services = (payload?.featuredServices || []).map(mapService);
  const products = (payload?.featuredProducts || []).map(mapProduct);

  return {
    hero: mapHero(payload?.hero),
    featuredServices: services.length ? services : fallback.featuredServices,
    featuredProducts: products.length ? products : fallback.featuredProducts,
    location: mapLocation(payload?.location),
    community: mapCommunity(payload?.community),
  };
}

export function useHomeData() {
  return useQuery({
    queryKey: ['home'],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const response = await apiGet<ApiHomeResponse>('/v1/home');
      return transformResponse(response);
    },
  });
}
