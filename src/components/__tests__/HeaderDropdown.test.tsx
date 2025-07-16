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
});
