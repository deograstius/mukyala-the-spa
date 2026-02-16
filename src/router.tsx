/* eslint-disable react-refresh/only-export-components */

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  notFound,
} from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/react-router';
import { apiGet } from '@utils/api';
import Footer from './components/Footer';
import Header from './components/Header';

import About from './pages/About';
import Checkout from './pages/Checkout';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Home from './pages/Home';
import ManageNotifications from './pages/ManageNotifications';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProductDetail from './pages/ProductDetail';
import Reservation from './pages/Reservation';
import ServiceDetail from './pages/ServiceDetail';
import Services from './pages/Services';
import Shop from './pages/Shop';
import TermsOfService from './pages/TermsOfService';
// Root layout

const RootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

// Child routes

const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: Home,
});

const AboutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'about',
  component: About,
});

const ServicesRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'services',
  component: Services,
});

const ServiceDetailRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'services/$slug',
  // Load service by slug from API; 404 when not found
  loader: async ({ params }) => {
    const slug = params.slug;
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
    const services = await apiGet<ApiService[]>('/v1/services');
    const s = (services || []).find((it) => it.slug === slug);
    if (!s) throw notFound();
    return {
      slug: s.slug,
      title: s.title,
      href: `/services/${s.slug}`,
      image: s.image || '',
      imageSrcSet: s.imageSrcSet,
      imageSizes: s.imageSizes,
      description: s.description,
      duration: s.durationMinutes ? `${s.durationMinutes} min` : undefined,
      priceCents: s.priceCents,
    };
  },
  component: ServiceDetail,
});

const ShopRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'shop',
  component: Shop,
});

const ProductDetailRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'shop/$slug',
  // Load product by slug from API; 404 when not found
  loader: async ({ params }) => {
    const slug = params.slug;
    type ApiProduct = {
      slug: string;
      title: string;
      priceCents: number;
      image?: string;
      imageSrcSet?: string;
      imageSizes?: string;
    };
    const products = await apiGet<ApiProduct[]>('/v1/products');
    const p = (products || []).find((it) => it.slug === slug);
    if (!p) throw notFound();
    return {
      slug: p.slug,
      title: p.title,
      priceCents: p.priceCents,
      image: p.image || '',
      imageSrcSet: p.imageSrcSet,
      imageSizes: p.imageSizes,
      href: `/shop/${p.slug}`,
    };
  },
  component: ProductDetail,
});

const CheckoutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'checkout',
  validateSearch: (search: Record<string, unknown>) => ({
    missingOrder: typeof search.missingOrder === 'string' ? search.missingOrder : undefined,
  }),
  component: Checkout,
});

const CheckoutSuccessRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'checkout/success',
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  component: CheckoutSuccess,
});

const CheckoutCancelRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'checkout/cancel',
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
  }),
  component: CheckoutCancel,
});

const ReservationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'reservation',
  component: Reservation,
});

const PrivacyRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'privacy',
  component: PrivacyPolicy,
});

const TermsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'terms',
  component: TermsOfService,
});

const ManageNotificationsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'notifications/manage',
  component: ManageNotifications,
});

// 404 catch-all

const NotFoundRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '*',
  component: NotFound,
});

// Build the route tree

export const routeTree = RootRoute.addChildren([
  IndexRoute,
  AboutRoute,
  ServicesRoute,
  ServiceDetailRoute,
  ShopRoute,
  ProductDetailRoute,
  CheckoutRoute,
  CheckoutSuccessRoute,
  CheckoutCancelRoute,
  ReservationRoute,
  PrivacyRoute,
  TermsRoute,
  ManageNotificationsRoute,
  NotFoundRoute,
]);

// Create the router instance

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
  scrollRestoration: true,
});

export type RouterType = typeof router;

// Test helper: isolated router with memory history
export function createTestRouter(initialEntries: string[] = ['/']) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  });
}
