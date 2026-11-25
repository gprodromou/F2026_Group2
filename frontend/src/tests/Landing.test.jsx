// Landing.test.jsx: tests for the rebuilt landing page and its header (Yanna, week 7).
//   - signed out: the login card with the real login form, and the Register link
//   - signed in: a welcome card with links into the app instead of the login form
//   - the carousel dots change the slide in the big card
//   - the header shows About, Services and Contact us to visitors, linking to the sections
//   - logging in from the landing card sends the details to POST /auth/login
//   - the footer shows the four social links

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../routes';
import { AuthProvider } from '../state/AuthContext';
import { clearPendingLogin } from '../lib/pendingLogin';

// Same fake login token as Nav.test.jsx: AuthContext reads it like a real JWT.
function makeToken(role = 'user') {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 1, role, exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  clearPendingLogin();
});

describe('Landing', () => {
  test('signed out: shows the login card with the login form and a Register link', () => {
    renderHome();

    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
    expect(screen.getByLabelText('Email address')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Register Here' }).getAttribute('href')).toBe('/register');
  });

  test('signed in: shows the welcome card instead of the login form', () => {
    localStorage.setItem('token', makeToken());
    renderHome();

    expect(screen.getByRole('heading', { name: 'Welcome back!' })).toBeTruthy();
    expect(screen.queryByLabelText('Email address')).toBeNull();
    expect(screen.getByRole('link', { name: 'Log a workout' }).getAttribute('href')).toBe('/workouts/new');
  });

  test('clicking a carousel dot shows that slide', () => {
    renderHome();

    // All five slides are on the page (stacked, for the cross-fade); only the current one
    // is visible, and the others are hidden from screen readers with aria-hidden.
    const slideOf = (text) => screen.getByText(text).closest('.landing-slide');
    const chat = 'Chat with a personal trainer at any time.';
    const log = 'Log every workout in seconds.';

    expect(slideOf(chat).getAttribute('aria-hidden')).toBeNull();
    expect(slideOf(log).getAttribute('aria-hidden')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Show slide 2 of 5' }));

    expect(slideOf(log).getAttribute('aria-hidden')).toBeNull();
    expect(slideOf(log).className).toContain('landing-slide--active');
    expect(slideOf(chat).getAttribute('aria-hidden')).toBe('true');
    expect(
      screen.getByRole('button', { name: 'Show slide 2 of 5' }).getAttribute('aria-current')
    ).toBe('true');
  });

  test('visitors see About, Services and Contact us in the header, linking to the sections', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'About' }).getAttribute('href')).toBe('/#about');
    expect(screen.getByRole('link', { name: 'Services' }).getAttribute('href')).toBe('/#services');
    expect(screen.getByRole('link', { name: 'Contact us' }).getAttribute('href')).toBe('/#contact');
    expect(screen.getByRole('heading', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Services' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Contact us' })).toBeTruthy();
  });

  test('signed-in users do not get the About / Services / Contact us header links', () => {
    localStorage.setItem('token', makeToken());
    renderHome();

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav.textContent).not.toMatch(/About|Services|Contact us/);
  });

  test('logging in from the landing card sends the details to POST /auth/login', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Wrong email or password' }),
    });
    renderHome();

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password');
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch.mock.calls[0][0]).toBe('/auth/login');
    expect(screen.getByLabelText('Email address').value).toBe('demo@example.com');
  });

  test('the footer shows the four social links', () => {
    renderHome();

    ['Facebook', 'Instagram', 'LinkedIn', 'YouTube'].forEach((name) => {
      expect(screen.getByRole('link', { name })).toBeTruthy();
    });
  });
});
