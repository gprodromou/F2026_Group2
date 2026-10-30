import { render, screen } from '@testing-library/react';
import FormError from '../components/ui/FormError';

test('shows the message with role alert', () => {
  render(<FormError message="Email is required" />);
  expect(screen.getByRole('alert').textContent).toBe('Email is required');
});

test('renders nothing when there is no message', () => {
  const { container } = render(<FormError message={null} />);
  expect(container.firstChild).toBeNull();
});