import { RouterProvider } from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import { createAdminRouter } from '../AdminApp';

// /scan auto-opens the scanner (#18a); stub it so these shell tests don't
// drag in the camera/zxing stack.
vi.mock('@features/retail/BarcodeScanner', () => ({
  default: () => <div>mock-scanner</div>,
}));

const TOKEN_KEY = 'retail:token:v1';

function renderApp(path = '/') {
  return render(<RouterProvider router={createAdminRouter([path])} />);
}

function useShellHandlers() {
  server.use(
    http.get('/v1/retail/categories', () => HttpResponse.json([])),
    http.get('/v1/retail/products', () => HttpResponse.json([])),
  );
}

beforeEach(() => {
  window.localStorage.removeItem(TOKEN_KEY);
});

describe('admin login gate', () => {
  it('shows the login screen when logged out — no menu, no username in the bundle', async () => {
    renderApp('/scan');
    expect(await screen.findByRole('heading', { name: 'Mukyala Admin' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    // Spec §4: no menu/sign-out until authed.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Settings menu')).not.toBeInTheDocument();
  });

  it('logs in and lands on the live scanner with the 3-item menu + gear', async () => {
    useShellHandlers();
    server.use(
      http.post('/v1/retail/login', () => HttpResponse.json({ token: 't1', username: 'abryemah' })),
    );
    renderApp('/scan');
    await userEvent.type(await screen.findByLabelText('Password'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    // Zero-tap: the scanner is already open after login (#18a).
    expect(await screen.findByText('mock-scanner')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
    expect(nav).toBeInTheDocument();
    // Main Website links OUT (env-aware; staging default under jsdom) and the
    // two in-app routes are present.
    const mainWebsite = within(nav).getByRole('link', { name: 'Main Website' });
    expect(mainWebsite).toHaveAttribute('href', 'https://staging.mukyala.com');
    expect(within(nav).getByRole('link', { name: 'Scan' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByLabelText('Settings menu')).toBeInTheDocument();
  });

  it('collapses the menu items into the mobile hamburger slide-over (#18b)', async () => {
    useShellHandlers();
    window.localStorage.setItem(TOKEN_KEY, 'valid-token');
    renderApp('/scan');
    const hamburger = await screen.findByRole('button', { name: 'Open menu' });
    await userEvent.click(hamburger);

    // SlideOver exposes the slide-over as a dialog (same as the customer nav).
    const mobileNav = await screen.findByRole('dialog');
    expect(within(mobileNav).getByRole('link', { name: 'Main Website' })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: 'Scan' })).toBeInTheDocument();
    // Navigating from the slide-over closes it.
    await userEvent.click(within(mobileNav).getByRole('link', { name: 'Products' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('account menu', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOKEN_KEY, 'valid-token');
  });

  it('opens Settings from the two-item menu', async () => {
    useShellHandlers();
    renderApp('/scan');
    await userEvent.click(await screen.findByLabelText('Settings menu'));
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Settings' }));
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
  });

  it('signs out from the menu: token cleared, login screen back', async () => {
    useShellHandlers();
    renderApp('/scan');
    await userEvent.click(await screen.findByLabelText('Settings menu'));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Mukyala Admin' })).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('auth expiry', () => {
  it('drops to the login screen when the API answers 401', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'stale-token');
    server.use(
      http.get('/v1/retail/products', () =>
        HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
      ),
      http.get('/v1/retail/categories', () =>
        HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
      ),
    );
    renderApp('/products');
    expect(await screen.findByLabelText('Password')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
