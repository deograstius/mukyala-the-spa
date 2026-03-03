import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
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

describe('PrivacyPolicy page', () => {
  it('renders at /privacy with explicit mobile messaging consent carve-outs', async () => {
    await renderRoute('/privacy');

    expect(
      screen.getByRole('heading', { level: 1, name: /mukyala privacy policy/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/we do not sell or rent your mobile number/i)).toBeInTheDocument();
    expect(
      screen.getByText(/we use your mobile number only for mukyala communications/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /share it only with required processors \(such as twilio\) solely to deliver/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /sms\/mobile messaging privacy/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'All of the data-sharing categories described elsewhere in this Privacy Policy exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps rendering when query params are empty', async () => {
    await renderRoute('/privacy?utm_source=');

    expect(
      screen.getByRole('heading', { level: 1, name: /mukyala privacy policy/i }),
    ).toBeInTheDocument();
  });

  it('keeps rendering when query params are max length', async () => {
    const longQueryValue = 'x'.repeat(512);
    await renderRoute(`/privacy?utm_source=${longQueryValue}`);

    expect(
      screen.getByRole('heading', { level: 1, name: /mukyala privacy policy/i }),
    ).toBeInTheDocument();
  });

  it('shows not found for an invalid privacy route', async () => {
    await renderRoute('/privacy-invalid');

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: /mukyala privacy policy/i }),
    ).not.toBeInTheDocument();
  });
});
