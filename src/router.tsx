/* eslint-disable react-refresh/only-export-components */

import type { ApiProduct, ApiService } from '@hooks/catalog.api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  notFound,
  redirect,
} from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/react-router';
import { apiGet } from '@utils/api';
import { useState } from 'react';
import TelemetryRoot from './app/TelemetryRoot';
// CookieBanner is mounted at the bottom of RootLayout (sibling of Footer) so
// the bottom-fixed banner has a stable mount point that survives route changes.
import CookieBanner from './components/CookieBanner';
import Footer from './components/Footer';
import Header from './components/Header';

import About from './pages/About';
import Checkout from './pages/Checkout';
import CheckoutCancel from './pages/CheckoutCancel';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Consultation from './pages/Consultation';
import Home from './pages/Home';
import ManageNotifications from './pages/ManageNotifications';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProductDetail from './pages/ProductDetail';
import RefundsPolicy from './pages/RefundsPolicy';
import Reservation from './pages/Reservation';
import Retail from './pages/Retail';
import ServiceDetail from './pages/ServiceDetail';
import Services from './pages/Services';
import ShippingPolicy from './pages/ShippingPolicy';
import Shop from './pages/Shop';
import SmsDisclosures from './pages/SmsDisclosures';
import TermsOfService from './pages/TermsOfService';
// Root layout

const RootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  // The layout owns its QueryClient so every consumer of the route tree —
  // app (main.tsx), prerender, and tests rendering createTestRouter — gets a
  // client without wrapping RouterProvider themselves. Header's CartDrawer
  // reads the product catalog through react-query, so the provider must sit
  // at (or above) this layout. Created via state so each mounted tree gets a
  // fresh cache (keeps tests isolated).
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TelemetryRoot />
      <Header />
      <Outlet />
      <Footer />
      {/* CookieBanner mounts last so it z-stacks above page content. */}
      <CookieBanner />
    </QueryClientProvider>
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
  // Load service by slug from API; 404 when not found or inactive
  loader: async ({ params }) => {
    const slug = params.slug;
    const services = await apiGet<ApiService[]>('/v1/services');
    const s = (services || []).find((it) => it.slug === slug);
    if (!s || s.active === false) throw notFound();
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
    const products = await apiGet<ApiProduct[]>('/v1/products');
    const p = (products || []).find((it) => it.slug === slug);
    // The API only serves active rows; the explicit check guards against
    // cached payloads that still carry a row flipped inactive since.
    if (!p || p.active === false) throw notFound();
    return {
      slug: p.slug,
      title: p.title,
      priceCents: p.priceCents,
      image: p.image || '',
      imageSrcSet: p.imageSrcSet,
      imageSizes: p.imageSizes,
      href: `/shop/${p.slug}`,
      sku: p.sku,
      active: p.active,
      description: p.description,
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

// Staff-only back-office (unlisted; token-gated in the page itself).
const RetailRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'retail',
  component: Retail,
});

const ReservationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'reservation',
  component: Reservation,
});

// Consultation wizard (Form 1 / `intake`).
//
// Routing pattern:
//  - /consultation              → renders Step 1 (default landing).
//  - /consultation/$step        → param route; valid values: step-1..step-6.
//                                 Invalid values fall through to step-1.
//
// The success state is rendered in-place inside `Consultation` after a 200
// from POST /v1/consultations (no separate /success URL in v1).
const VALID_STEPS: ReadonlyArray<'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5' | 'step-6'> =
  ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6'];

function isValidStep(s: string): s is (typeof VALID_STEPS)[number] {
  return (VALID_STEPS as ReadonlyArray<string>).includes(s);
}

// Bare `/consultation` redirects into the $step route so the whole wizard
// lives under ONE route match. Rendering it as a separate route used to
// remount <Consultation> (fresh empty draft + re-armed resume prompt) the
// moment the user navigated from `/consultation` to `/consultation/step-2`,
// which visibly dropped a just-resumed draft.
const ConsultationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'consultation',
  beforeLoad: () => {
    throw redirect({ to: '/consultation/$step', params: { step: 'step-1' }, replace: true });
  },
});

const ConsultationStepRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'consultation/$step',
  component: ConsultationStepView,
});

function ConsultationStepView() {
  const params = ConsultationStepRoute.useParams();
  const step = isValidStep(params.step) ? params.step : 'step-1';
  return <Consultation currentStep={step} />;
}

// CCPA-compliant privacy policy. Required link in Footer's "Do Not Sell or
// Share My Personal Information" row — keep `/privacy` reachable from every
// page. See src/pages/PrivacyPolicy.tsx for content + last-reviewed date.
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

const RefundsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'refunds',
  component: RefundsPolicy,
});

const ShippingRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'shipping',
  component: ShippingPolicy,
});

const SmsDisclosuresRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'sms-disclosures',
  component: SmsDisclosures,
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
  RetailRoute,
  ReservationRoute,
  ConsultationRoute,
  ConsultationStepRoute,
  PrivacyRoute,
  TermsRoute,
  RefundsRoute,
  ShippingRoute,
  SmsDisclosuresRoute,
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
