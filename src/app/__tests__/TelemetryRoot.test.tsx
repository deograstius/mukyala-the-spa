import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestRouter } from '../../router';
import TelemetryRoot from '../TelemetryRoot';

type Envelope = {
  event: string;
  route?: string;
  path?: string;
  props?: Record<string, unknown>;
  utm?: Record<string, unknown>;
  referrer?: string;
  ctaId?: string;
};

function installTelemetryFetchCapture() {
  const originalFetch = globalThis.fetch;
  const captured: Envelope[] = [];

  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/v1/events')) {
      const body = typeof init?.body === 'string' ? init.body : '';
      try {
        captured.push(JSON.parse(body) as Envelope);
      } catch {
        // ignore
      }
      return new Response('', { status: 204 });
    }
    return originalFetch(input as RequestInfo, init);
  });

  return {
    getCaptured: () => captured.slice(),
    restore: () => spy.mockRestore(),
  };
}

function assertNoUnsafePropKeys(envs: Envelope[]) {
  for (const env of envs) {
    const p = env.props ?? {};
    for (const k of ['email', 'phone', 'name', 'address']) {
      expect(Object.prototype.hasOwnProperty.call(p, k)).toBe(false);
    }
  }
}

describe('TelemetryRoot', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits exactly one page_view per navigation and a matching page_exit', async () => {
    const cap = installTelemetryFetchCapture();
    const router = createTestRouter(['/about']);

    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.load();
    });

    await act(async () => {
      await router.navigate({ to: '/privacy' });
    });

    const events = cap
      .getCaptured()
      .filter((e) => e.event === 'page_view' || e.event === 'page_exit');
    cap.restore();

    const pageViews = events.filter((e) => e.event === 'page_view');
    const pageExits = events.filter((e) => e.event === 'page_exit');

    expect(pageViews).toHaveLength(2);
    expect(pageViews[0]?.path).toBe('/about');
    expect(pageViews[1]?.path).toBe('/privacy');

    expect(pageExits).toHaveLength(1);
    expect(pageExits[0]?.path).toBe('/about');
    expect((pageExits[0]?.props as { durationMs?: unknown })?.durationMs).toSatisfy(
      (v: unknown) => {
        return typeof v === 'number' && v >= 0;
      },
    );
    expect((pageExits[0]?.props as { reason?: unknown })?.reason).toBe('navigate');
    expect((pageExits[0]?.props as { toPath?: unknown })?.toPath).toBe('/privacy');

    assertNoUnsafePropKeys(events);
  });

  it('emits cta_click only for elements with data-cta-id and includes targetPath when available', async () => {
    const cap = installTelemetryFetchCapture();
    const user = userEvent.setup();
    const RootRoute = createRootRoute({
      component: () => (
        <>
          <TelemetryRoot />
          <Outlet />
        </>
      ),
    });
    const IndexRoute = createRoute({
      getParentRoute: () => RootRoute,
      path: '/',
      component: () => (
        <div>
          <a
            href="/shop?utm_source=test#frag"
            data-cta-id="test-shop-link"
            onClick={(e) => e.preventDefault()}
          >
            Shop
          </a>
          <button type="button">Not tracked</button>
        </div>
      ),
    });
    const router = createRouter({
      routeTree: RootRoute.addChildren([IndexRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });

    render(<RouterProvider router={router} />);
    await act(async () => {
      await router.load();
    });

    await user.click(screen.getByRole('link', { name: /shop/i }));
    await user.click(screen.getByRole('button', { name: /not tracked/i }));

    const clickEvents = cap.getCaptured().filter((e) => e.event === 'cta_click');
    cap.restore();

    expect(clickEvents).toHaveLength(1);
    expect(clickEvents[0]?.ctaId).toBe('test-shop-link');
    expect((clickEvents[0]?.props as { targetPath?: unknown } | undefined)?.targetPath).toBe(
      '/shop',
    );

    assertNoUnsafePropKeys(clickEvents);
  });
});
