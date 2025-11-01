import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Services from '../Services';

describe('Services page', () => {
  it('renders hero and service grid', async () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <Services />
      </QueryClientProvider>,
    );

    // Heading
    expect(screen.getByRole('heading', { level: 1, name: /services/i })).toBeInTheDocument();

    // Service cards (links by title)
    // One service card from MSW defaults
    expect(await screen.findByRole('link', { name: /baobab glow facial/i })).toBeInTheDocument();
  });

  it('includes community section CTA', () => {
    const qc = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={qc}>
        <Services />
      </QueryClientProvider>,
    );
    // From Community component: "Follow us" link
    const follow = screen.getAllByRole('link', { name: /follow us/i })[0];
    expect(follow).toBeInTheDocument();

    // Has community grid present
    expect(container.querySelector('.community-grid')).toBeTruthy();
  });
});
