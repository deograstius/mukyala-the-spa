import { createRoot } from 'react-dom/client';
import '../src/styles/global.css';
import '../src/dmv/dmv.css';
import DmvApp from '../src/dmv/DmvApp';

// DMV event site entry (dmv[.staging].mukyala.com). No CartProvider, no
// react-query, no GTM, no cookie banner — a single-purpose ticketing site
// that reuses the spa's design system wholesale (spec decision #17).
createRoot(document.getElementById('root')!).render(<DmvApp />);
