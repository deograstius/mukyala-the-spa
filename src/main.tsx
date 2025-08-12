import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { CartProvider } from './contexts/CartContext';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <CartProvider>
    <RouterProvider router={router} />
  </CartProvider>,
);
