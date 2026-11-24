// routes.test.jsx: proves the app shell works (NFR05).
//   - every route in the router resolves to a page
//   - the main frame (navigation) wraps Landing and NotFound
//   - Login and Register use the simpler frame without navigation
//   - an unknown address shows the not-found page instead of a blank screen
//   - /workouts shows the workout history (week 5)
//   - /goals shows the goals screen (week 6)
// MemoryRouter lets the test "open" an address without a real browser.

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../routes';
import { AuthProvider } from '../state/AuthContext';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

// Same fake login token as WorkoutList.test.jsx: AuthContext reads the
// user id, role and expiry out of the token, so it must look like a real JWT.
function makeToken() {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 7, role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
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

  test('the two-factor screens send a visitor without a login back to the login page', () => {
    renderAt('/two-factor/verify');
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeTruthy();
  });

  test('the two-factor setup screen sends a visitor without a token to the login page', () => {
    localStorage.clear();
    renderAt('/two-factor/setup');
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeTruthy();
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

  // Week 5: WorkoutList was built in week 4 but never routed, so /workouts
  // fell through to the catch-all and showed "Page not found".
  test('the address /workouts shows the workout history, not the not-found page', async () => {
    // WorkoutList asks the API for workouts when it opens. There is no server
    // in Jest, so fetch is replaced with a fake that answers "no workouts yet".
    const realFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    // Signed in: a token AuthContext accepts, and the real AuthProvider around
    // the app, the same way WorkoutList.test.jsx does it.
    localStorage.setItem('token', makeToken());

    try {
      render(
        <MemoryRouter initialEntries={['/workouts']}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>
      );

      // findBy waits for the page to finish loading; getBy would check too early.
      expect(await screen.findByRole('heading', { name: 'Workout History' })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: /^page not found$/i })).toBeNull();
    } finally {
      // Put things back even if the test fails, so other tests are not affected.
      global.fetch = realFetch;
      localStorage.clear();
    }
  });

  // Week 6: the goals screen, routed so /goals does not fall through to "Page not found".
  test('the address /goals shows the goals screen, not the not-found page', async () => {
    const realFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    localStorage.setItem('token', makeToken());

    try {
      render(
        <MemoryRouter initialEntries={['/goals']}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(await screen.findByRole('heading', { name: 'My Goals' })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: /^page not found$/i })).toBeNull();
    } finally {
      global.fetch = realFetch;
      localStorage.clear();
    }
  });
});
