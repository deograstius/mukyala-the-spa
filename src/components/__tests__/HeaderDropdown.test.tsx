import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderDropdown from '../HeaderDropdown';

describe('HeaderDropdown', () => {
  it('opens the dropdown menu when clicked and closes on second click', async () => {
    const user = userEvent.setup();

    render(
      <HeaderDropdown
        label="Products"
        items={[
          { label: 'Shampoo', href: '/shop/shampoo' },
          { label: 'Conditioner', href: '/shop/conditioner' },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: /products/i });
    expect(screen.queryByRole('link', { name: /shampoo/i })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole('link', { name: /shampoo/i })).toBeVisible();

    // Click again to close
    await user.click(trigger);
    expect(screen.queryByRole('link', { name: /shampoo/i })).not.toBeInTheDocument();
  });

  it('closes on Escape and outside click', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <HeaderDropdown
          label="Products"
          items={[
            { label: 'Shampoo', href: '/shop/shampoo' },
            { label: 'Conditioner', href: '/shop/conditioner' },
          ]}
        />
        <button type="button">Outside</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /products/i });
    await user.click(trigger);
    const shampoo = screen.getByRole('link', { name: /shampoo/i });
    expect(shampoo).toBeVisible();

    // Escape closes
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: /shampoo/i })).not.toBeInTheDocument();

    // Reopen and click outside to close
    await user.click(trigger);
    expect(screen.getByRole('link', { name: /shampoo/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /outside/i }));
    expect(screen.queryByRole('link', { name: /shampoo/i })).not.toBeInTheDocument();
  });
});
