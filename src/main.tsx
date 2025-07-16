import { RouterProvider } from '@tanstack/react-router';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { router } from './router';

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
