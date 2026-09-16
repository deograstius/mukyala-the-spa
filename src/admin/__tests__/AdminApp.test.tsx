import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { server, http, HttpResponse } from '../../test/msw.server';
import { createAdminRouter } from '../AdminApp';

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
    expect(screen.queryByLabelText('Account menu')).not.toBeInTheDocument();
  });

  it('logs in and lands on the Scan surface with the 3-item menu + account icon', async () => {
    useShellHandlers();
    server.use(
      http.post('/v1/retail/login', () => HttpResponse.json({ token: 't1', username: 'abryemah' })),
    );
    renderApp('/scan');
    await userEvent.type(await screen.findByLabelText('Password'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('button', { name: 'Scan barcode' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
    expect(nav).toBeInTheDocument();
    // Main Website links OUT (env-aware; staging default under jsdom) and the
    // two in-app routes are present.
    const mainWebsite = screen.getByRole('link', { name: 'Main Website' });
    expect(mainWebsite).toHaveAttribute('href', 'https://staging.mukyala.com');
    expect(screen.getByRole('link', { name: 'Scan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByLabelText('Account menu')).toBeInTheDocument();
  });
});

describe('account menu', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOKEN_KEY, 'valid-token');
  });

  it('opens Settings from the two-item menu', async () => {
    useShellHandlers();
    renderApp('/scan');
    await userEvent.click(await screen.findByLabelText('Account menu'));
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Settings' }));
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
  });

  it('signs out from the menu: token cleared, login screen back', async () => {
    useShellHandlers();
    renderApp('/scan');
    await userEvent.click(await screen.findByLabelText('Account menu'));
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
