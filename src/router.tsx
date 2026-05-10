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
import TelemetryRoot from './app/TelemetryRoot';
// chunk: spa-tracking-and-consent-2026-05-09 (architect stub).
// CookieBanner currently renders null (architect stub) — see
// src/components/CookieBanner.tsx for the implementer playbook. Mounted at the
// bottom of RootLayout (sibling of Footer) so the bottom-fixed banner has a
// stable mount point that survives route changes.
import CookieBanner from './components/CookieBanner';
import Footer from './components/Footer';
// chunk: spa-launch-readiness-seo-2026-05-09 (architect stub) — Founders' Rate
// promo ribbon. Currently a no-op (renders null) until implementer + operator
// finalize copy + styling. See src/components/FoundersRibbon.tsx for the
// implementer playbook + persistence + telemetry contract.
import FoundersRibbon from './components/FoundersRibbon';
import Header from './components/Header';
// chunk: spa-tracking-and-consent-2026-05-09 (architect stub).
// NewsletterSignup placed above the footer (variant="inline") on every page.
// Implementer wires copy + endpoint; architect drops it here so the surface
// exists. There is also a /about-page section placement (variant="section") —
// see src/pages/About.tsx for that mount point + TODO(architect).
import NewsletterSignup from './components/NewsletterSignup';

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
  return (
    <>
      <TelemetryRoot />
      {/*
        chunk: spa-launch-readiness-seo-2026-05-09 (architect stub).
        FoundersRibbon mounts ABOVE <Header /> so it sits at the very top of
        every viewport (sitewide promo, not home-only). Currently renders
        null — see src/components/FoundersRibbon.tsx file header for the
        implementer playbook. TODO(architect): once the ribbon renders real
        DOM, verify Header's sticky/fixed offset still resolves correctly
        and adjust .header-wrapper top spacing if required.
      */}
      <FoundersRibbon />
      <Header />
      <Outlet />
      {/*
        chunk: spa-tracking-and-consent-2026-05-09 (implementer pass).
        NewsletterSignup (inline variant) sits above the footer on every page.
        Sitewide rendering is exercised by e2e/spa-tracking-and-consent.spec.ts
        and unit-tested in src/components/__tests__/NewsletterSignup.test.tsx.
      */}
      <NewsletterSignup variant="inline" />
      <Footer />
      {/*
        chunk: spa-tracking-and-consent-2026-05-09 (architect stub).
        CookieBanner mounts last so it z-stacks above page content. Currently
        renders null — see src/components/CookieBanner.tsx implementer playbook.
      */}
      <CookieBanner />
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

const ConsultationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'consultation',
  component: () => <Consultation currentStep="step-1" />,
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
