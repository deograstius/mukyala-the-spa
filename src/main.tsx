import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Global Webflow styles – they pull in normalize.css, webflow.css and the
// project-specific stylesheet so we can keep the exact look & feel while we
// incrementally migrate styles to a React-friendly approach.
import './styles/global.css';
import Home from './pages/Home';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
