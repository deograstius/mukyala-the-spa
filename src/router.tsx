/* eslint-disable react-refresh/only-export-components */

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  notFound,
} from '@tanstack/react-router';
import { createMemoryHistory } from '@tanstack/react-router';
import Footer from './components/Footer';
import Header from './components/Header';
import { shopProducts } from './data/products';
import { services as spaServices } from './data/services';

import About from './pages/About';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProductDetail from './pages/ProductDetail';
import Reservation from './pages/Reservation';
import ServiceDetail from './pages/ServiceDetail';
import Services from './pages/Services';
import Shop from './pages/Shop';
import { getSlugFromHref } from './utils/slug';
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
  // Load service by slug; 404 when not found
  loader: ({ params }) => {
    const slug = params.slug;
    const item = spaServices.find((s) => (s.slug ?? getSlugFromHref(s.href)) === slug);
    if (!item) {
      throw notFound({ message: 'Service not found' });
    }
    return item;
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
  // Load product by slug; 404 when not found
  loader: ({ params }) => {
    const slug = params.slug;
    const product = shopProducts.find((p) => (p.slug ?? getSlugFromHref(p.href)) === slug);
    if (!product) {
      throw notFound({ message: 'Product not found' });
    }
    return product;
  },
  component: ProductDetail,
});

const CheckoutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'checkout',
  component: Checkout,
});

const ReservationRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'reservation',
  component: Reservation,
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
  ReservationRoute,
  NotFoundRoute,
]);

// Create the router instance

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
});

export type RouterType = typeof router;

// Test helper: isolated router with memory history
export function createTestRouter(initialEntries: string[] = ['/']) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries }),
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  });
}
