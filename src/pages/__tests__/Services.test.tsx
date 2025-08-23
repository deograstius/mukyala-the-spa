import { render, screen } from '@testing-library/react';
import Services from '../Services';

describe('Services page', () => {
  it('renders hero and service grid', () => {
    render(<Services />);

    // Heading
    expect(screen.getByRole('heading', { level: 1, name: /services/i })).toBeInTheDocument();

    // Service cards (links by title)
    const titles = [
      /baobab glow facial/i,
      /kalahari melon hydration facial/i,
      /rooibos radiance facial/i,
      /shea gold collagen lift/i,
    ];
    titles.forEach((t) => {
      expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
    });
  });

  it('includes community section CTA', () => {
    const { container } = render(<Services />);
    // From Community component: "Follow us" link
    const follow = screen.getAllByRole('link', { name: /follow us/i })[0];
    expect(follow).toBeInTheDocument();

    // Has community grid present
    expect(container.querySelector('.community-grid')).toBeTruthy();
  });
});
