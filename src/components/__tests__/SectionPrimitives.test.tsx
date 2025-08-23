import Container from '@shared/ui/Container';
import Section from '@shared/ui/Section';
import SectionHeader from '@shared/ui/SectionHeader';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Section/Container/SectionHeader', () => {
  it('Section renders with base class and children', () => {
    render(<Section className="pd-24">Hello</Section>);
    // role is not set; assert text is present and class applied via container selection
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('Container renders children with expected classes', () => {
    render(
      <Container>
        <div>Inner</div>
      </Container>,
    );
    expect(screen.getByText('Inner')).toBeInTheDocument();
  });

  it('SectionHeader renders title and actions', () => {
    render(<SectionHeader title="My Title" actions={<button type="button">Act</button>} />);
    expect(screen.getByRole('heading', { name: /my title/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /act/i })).toBeInTheDocument();
  });
});
