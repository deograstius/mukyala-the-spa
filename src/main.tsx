import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/global.css';
import Home from './pages/Home';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
