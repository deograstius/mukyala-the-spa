import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import Shop from '../Shop';

describe('Shop page', () => {
  it('renders hero and product grid', async () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <Shop />
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole('heading', {
        name: /shop/i,
        level: 1,
      }),
    ).toBeInTheDocument();

    // One product link is present from MSW default
    const link = await screen.findByRole('link', { name: /DermaQuest B5 Hydrating Serum/i });
    expect(link).toHaveAttribute('href', '/shop/b5-hydrating-serum');
  });
});
