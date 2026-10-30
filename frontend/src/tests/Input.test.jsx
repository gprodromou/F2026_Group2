import { render, screen } from '@testing-library/react';
import Input from '../components/ui/Input';

test('renders the label and links it to the input', () => {
  render(<Input id="email" label="Email" />);
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
});

test('shows the error through FormError and marks the input invalid', () => {
  render(<Input id="email" label="Email" error="Email is required" />);
  const input = screen.getByLabelText('Email');
  expect(screen.getByRole('alert').textContent).toBe('Email is required');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAttribute('aria-describedby', 'email-error');
});

test('shows no error when there is none', () => {
  render(<Input id="email" label="Email" />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
});

test('can be disabled', () => {
  render(<Input id="email" label="Email" disabled />);
  expect(screen.getByLabelText('Email')).toBeDisabled();
});