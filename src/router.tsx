/*
 * Minimal TanStack Router placeholder
 * ----------------------------------
 * The full TanStack Router v1 React adapter is not required yet because the
 * site only has a single page.  Still, we expose an `AppRouterProvider`
 * component to match the future API surface so that additional routes can be
 * layered in without touching `main.tsx`.
 */

import Footer from './components/Footer';
import Header from './components/Header';
import Home from './pages/Home';

export function AppRouterProvider() {
  return (
    <>
      <Header />
      <Home />
      <Footer />
    </>
  );
}
