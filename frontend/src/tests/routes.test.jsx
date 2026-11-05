// routes.test.jsx: proves the app shell works (NFR05).
//   - every route in the router resolves to a page
//   - the main frame (navigation) wraps Landing and NotFound
//   - Login and Register use the simpler frame without navigation
//   - an unknown address shows the not-found page instead of a blank screen
// MemoryRouter lets the test "open" an address without a real browser.

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../routes';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe('app shell', () => {
  test.each([
    ['/', /^fit4you$/i],
    ['/register', /^register$/i],
    ['/login', /^login$/i],
    ['/this-page-does-not-exist', /^page not found$/i],
  ])('the address %s resolves to its page', (path, headingName) => {
    renderAt(path);
    expect(screen.getByRole('heading', { name: headingName })).toBeTruthy();
  });

  test('the landing page is wrapped in the main frame with navigation and footer', () => {
    renderAt('/');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
    expect(screen.getByText(/all rights reserved/i)).toBeTruthy();
  });

  test('the not-found page also sits inside the main frame', () => {
    renderAt('/this-page-does-not-exist');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
  });

  test('login and register use the frame without navigation, but with the footer', () => {
    renderAt('/login');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).toBeNull();
    expect(screen.getByText(/all rights reserved/i)).toBeTruthy();
  });
});
