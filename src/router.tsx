/* eslint-disable react-refresh/only-export-components */

import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';

import Footer from './components/Footer';
import Header from './components/Header';
import About from './pages/About';
import Checkout from './pages/Checkout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import Shop from './pages/Shop';
// Root layout -----------------------------------------------------------------

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

// Utility stub component -------------------------------------------------------

function StubPage({ title }: { title: string }) {
  return (
    <main className="section">
      <div className="w-layout-blockcontainer container-default w-container">
        <h1 className="display-9" style={{ marginBottom: '1rem' }}>
          {title}
        </h1>
        <p className="paragraph-large">This page is coming soon.</p>
      </div>
    </main>
  );
}

// Child routes -----------------------------------------------------------------

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

const ShopRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'shop',
  component: Shop,
});

const ProductDetailRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'shop/$slug',
  component: ProductDetail,
});

const BlogRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'blog',
  component: () => <StubPage title="Blog" />,
});

const ContactRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'contact',
  component: () => <StubPage title="Contact" />,
});

const PricingRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'pricing',
  component: () => <StubPage title="Pricing" />,
});

const CheckoutRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'checkout',
  component: Checkout,
});

// 404 catch-all ---------------------------------------------------------------

const NotFoundRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '*',
  component: NotFound,
});

// Build the route tree ---------------------------------------------------------

const routeTree = RootRoute.addChildren([
  IndexRoute,
  AboutRoute,
  ServicesRoute,
  ShopRoute,
  ProductDetailRoute,
  BlogRoute,
  ContactRoute,
  PricingRoute,
  CheckoutRoute,
  NotFoundRoute,
]);

// Create the router instance ---------------------------------------------------

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
});

export type RouterType = typeof router;
