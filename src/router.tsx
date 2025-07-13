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
