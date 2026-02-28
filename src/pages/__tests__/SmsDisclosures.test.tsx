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

describe('SmsDisclosures page', () => {
  it('renders required disclosures at /sms-disclosures', async () => {
    await renderRoute('/sms-disclosures');

    expect(
      screen.getByRole('heading', { level: 1, name: /sms program disclosures/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/brand\/program name:\s*mukyala day spa waitlist sms program/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/message frequency varies/i)).toBeInTheDocument();
    expect(screen.getByText(/msg\s*&\s*data rates may apply/i)).toBeInTheDocument();
    expect(screen.getByText(/^stop$/i)).toBeInTheDocument();
    expect(screen.getByText(/^help$/i)).toBeInTheDocument();
    expect(screen.getByText(/waitlist sms messages are marketing texts/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /by texting to join the waitlist, you agree to receive recurring marketing/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/consent is not a condition of purchase/i)).toBeInTheDocument();

    const relatedPoliciesSection = screen
      .getByRole('heading', { level: 2, name: /related policies/i })
      .closest('div');
    expect(relatedPoliciesSection).not.toBeNull();
    expect(
      within(relatedPoliciesSection as HTMLDivElement).getByRole('link', {
        name: /privacy policy/i,
      }),
    ).toHaveAttribute('href', '/privacy');
    expect(
      within(relatedPoliciesSection as HTMLDivElement).getByRole('link', {
        name: /terms of service/i,
      }),
    ).toHaveAttribute('href', '/terms');
  });

  it('keeps rendering when query params are empty', async () => {
    await renderRoute('/sms-disclosures?utm_source=');

    expect(
      screen.getByRole('heading', { level: 1, name: /sms program disclosures/i }),
    ).toBeInTheDocument();
  });

  it('keeps rendering when query params are max length', async () => {
    const longQueryValue = 'x'.repeat(512);
    await renderRoute(`/sms-disclosures?utm_source=${longQueryValue}`);

    expect(
      screen.getByRole('heading', { level: 1, name: /sms program disclosures/i }),
    ).toBeInTheDocument();
  });

  it('shows not found for an invalid sms disclosures route', async () => {
    await renderRoute('/sms-disclosures-invalid');

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: /sms program disclosures/i }),
    ).not.toBeInTheDocument();
  });
});
