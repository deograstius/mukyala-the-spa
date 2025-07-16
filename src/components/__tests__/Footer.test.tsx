import { render, screen } from '@testing-library/react';

import Footer from '../Footer';

describe('Footer', () => {
  it('shows copyright notice and logo', () => {
    render(<Footer />);

    expect(screen.getByAltText(/mukyala day spa logo/i)).toBeInTheDocument();

    expect(screen.getByText(/© mukyala day spa/i)).toBeInTheDocument();
  });
});
