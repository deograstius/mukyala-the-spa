import { render, screen } from '@testing-library/react';

import NotFound from '../NotFound';

describe('NotFound page', () => {
  it('renders 404 headline and home link', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /page not found\./i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go back home/i })).toHaveAttribute('href', '/');
  });
});
