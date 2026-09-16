import { createRoot } from 'react-dom/client';
import '../src/styles/global.css';
import AdminApp from '../src/admin/AdminApp';

// Staff back-office entry (admin[.staging].mukyala.com). No CartProvider, no
// react-query, no telemetry, no cookie banner — this origin is a staff tool,
// not a customer journey.
createRoot(document.getElementById('root')!).render(<AdminApp />);
