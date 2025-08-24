import { RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { blogPosts } from '../../data/posts';
import { createTestRouter } from '../../router';

describe('Blog index', () => {
  it('renders blog heading and posts', async () => {
    const testRouter = createTestRouter(['/']);
    render(<RouterProvider router={testRouter} />);
    await act(async () => {
      await testRouter.navigate({ to: '/blog' });
    });
    expect(screen.getByRole('heading', { level: 1, name: /blog/i })).toBeInTheDocument();
    for (const p of blogPosts) {
      expect(screen.getByRole('heading', { level: 2, name: p.title })).toBeInTheDocument();
      expect(screen.getByText(p.excerpt)).toBeInTheDocument();
    }
  });
});
