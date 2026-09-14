import '@testing-library/jest-dom/vitest';

import * as React from 'react';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { server } from './msw.server';

// Mock TanStack Router's <Link> component so that we can render components that
// rely on it without creating a full router context in every unit-test.
interface MockLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
  // Router-only props that must not reach the DOM (React warns otherwise).
  activeProps?: unknown;
  activeOptions?: unknown;
  preload?: unknown;
  params?: unknown;
  search?: unknown;
}

vi.mock('@tanstack/react-router', async () => {
  const actual = (await vi.importActual(
    '@tanstack/react-router',
  )) as typeof import('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ to, children, ...rest }: MockLinkProps) => {
      // Router-only props must not leak onto the <a> (React warns about
      // unknown DOM attributes), and eslint rejects unused destructures.
      const anchorProps = Object.fromEntries(
        Object.entries(rest).filter(
          ([key]) => !['activeProps', 'activeOptions', 'preload', 'params', 'search'].includes(key),
        ),
      );
      return (
        <a href={typeof to === 'string' ? to : '#'} {...anchorProps}>
          {children}
        </a>
      );
    },
  };
});

// MSW server lifecycle
beforeAll(() => {
  // JSDOM throws "Not implemented" for `window.scrollTo`; TanStack Router's
  // scroll restoration uses it during route renders.
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
