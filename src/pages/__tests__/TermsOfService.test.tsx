import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestRouter } from '../../router';

async function renderRoute(initialPath: string) {
  const router = createTestRouter([initialPath]);
  render(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });
  return router;
}

describe('TermsOfService page', () => {
  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      value: vi.fn(),
      writable: true,
    });
  });

  it('renders the cancellations section and key cancellation policy details at /terms', async () => {
    await renderRoute('/terms');

    expect(
      screen.getByRole('heading', { level: 1, name: /mukyala terms of service/i }),
    ).toBeInTheDocument();

    const cancellationsHeading = screen.getByRole('heading', {
      level: 2,
      name: /cancellations/i,
    });
    expect(cancellationsHeading).toHaveAttribute('id', 'cancellations');

    expect(screen.getByText(/at least 24 hours before your reserved start time/i)).toBeVisible();
    expect(screen.getByText(/six-digit cancel code/i)).toBeVisible();
    expect(screen.getByText(/no-shows are treated as missed appointments/i)).toBeVisible();
  });

  it('keeps the cancellations section discoverable from /terms#cancellations', async () => {
    const router = await renderRoute('/terms#cancellations');

    expect(router.state.location.pathname).toBe('/terms');
    expect(router.state.location.hash).toBe('cancellations');
    expect(screen.getByRole('heading', { level: 2, name: /cancellations/i })).toBeInTheDocument();
  });

  it('still renders at /terms when query params are present', async () => {
    const longQueryValue = 'x'.repeat(256);
    await renderRoute(`/terms?utm_source=${longQueryValue}`);

    expect(
      screen.getByRole('heading', { level: 1, name: /mukyala terms of service/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /cancellations/i })).toBeInTheDocument();
  });

  it('shows not found for invalid terms route', async () => {
    await renderRoute('/terms-invalid');

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: /cancellations/i }),
    ).not.toBeInTheDocument();
  });
});
