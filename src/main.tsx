import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { AppRouterProvider } from './router';

createRoot(document.getElementById('root')!).render(<AppRouterProvider />);
