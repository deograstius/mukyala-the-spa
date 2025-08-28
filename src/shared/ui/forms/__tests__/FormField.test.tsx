import { render, screen } from '@testing-library/react';
import FormField from '../FormField';
import InputField from '../InputField';

describe('FormField', () => {
  it('renders label, help and error; wires aria attributes', () => {
    render(
      <FormField id="name" label="Name" helpText="Help" error="Required">
        <InputField placeholder="Your name" />
      </FormField>,
    );
    // Visible label
    expect(screen.getByText('Name')).toBeInTheDocument();
    // Input gets aria-invalid and describedby
    const input = screen.getByPlaceholderText('Your name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') || '';
    expect(describedBy).toContain('name-help');
    expect(describedBy).toContain('name-error');
    // Help and error rendered
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
