import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/global.css';
import { AppRouterProvider } from './router';

createRoot(document.getElementById('root')!).render(<AppRouterProvider />);
