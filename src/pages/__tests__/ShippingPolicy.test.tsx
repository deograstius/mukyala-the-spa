import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { createTestRouter } from '../../router';

async function renderRoute(initialPath: string) {
  const router = createTestRouter([initialPath]);
  render(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });
}

describe('ShippingPolicy page', () => {
  it('renders at /shipping with policy heading and updated date', async () => {
    await renderRoute('/shipping');

    expect(
      screen.getByRole('heading', { level: 1, name: /shipping\s*\/\s*fulfillment/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/last updated:\s*2026-02-28/i)).toBeInTheDocument();
  });

  it('keeps rendering when query params are present', async () => {
    await renderRoute('/shipping?utm_source=footer');

    expect(
      screen.getByRole('heading', { level: 1, name: /shipping\s*\/\s*fulfillment/i }),
    ).toBeInTheDocument();
  });

  it('shows shipping timeline, carriers, cost model, and delivery regions', async () => {
    await renderRoute('/shipping');

    expect(
      screen.getByRole('heading', { level: 2, name: /order processing/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2:00 PM PT/i)).toBeInTheDocument();
    expect(screen.getByText(/2.?3 business days/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: /carriers/i })).toBeInTheDocument();
    expect(screen.getByText(/USPS/i)).toBeInTheDocument();
    expect(screen.getByText(/UPS/i)).toBeInTheDocument();
    expect(screen.getByText(/FedEx/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: /shipping costs/i })).toBeInTheDocument();
    expect(screen.getByText(/calculated at checkout/i)).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 2, name: /delivery regions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/contiguous U\.S\., Alaska, and Hawaii/i)).toBeInTheDocument();
    expect(
      screen.getByText(/do not currently ship to international destinations/i),
    ).toBeInTheDocument();
  });

  it('links to the Refunds & Returns policy from the Returns section', async () => {
    await renderRoute('/shipping');

    const returnsSection = screen
      .getByRole('heading', { level: 2, name: /returns/i })
      .closest('div');
    expect(returnsSection).not.toBeNull();

    expect(
      within(returnsSection as HTMLDivElement).getByRole('link', {
        name: /refunds\s*&\s*returns/i,
      }),
    ).toHaveAttribute('href', '/refunds');
  });

  it('shows not found for an invalid shipping route', async () => {
    await renderRoute('/shipping-invalid');

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: /shipping\s*\/\s*fulfillment/i }),
    ).not.toBeInTheDocument();
  });
});
