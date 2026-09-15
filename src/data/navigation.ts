import type { NavLink } from '../types/data';

// Operator decision (2026-09-14): the header menu stays at exactly these four
// items. The booking/consultation funnels are reachable via page CTAs and the
// footer "Get started" block — do NOT add them here.
export const navLinks: NavLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Shop', path: '/shop' },
  { label: 'About', path: '/about' },
];
