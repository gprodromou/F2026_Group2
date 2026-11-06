// Nav.test.jsx: tests for the navigation states (NFR02, NFR05).
// A fake login token is saved in localStorage to stand in for "signed in", and the real
// AuthProvider (Bogdan C's context) reads it, exactly as it does in the app.

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Nav from '../components/Nav';
import AppRoutes from '../routes';
import { AuthProvider } from '../state/AuthContext';

// Builds a token with the same shape as the server's: header.payload.signature.
function makeToken({ role = 'user', expiresInSeconds = 3600 } = {}) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 1, role, exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

function renderNav() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Nav />} />
          <Route path="/login" element={<h1>Login</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

const link = (name) => screen.queryByRole('link', { name });
const button = (name) => screen.queryByRole('button', { name });

beforeEach(() => {
  localStorage.clear();
});

describe('Nav', () => {
  test('signed out: shows Home, Sign up and Sign in, and no Log out or Admin', () => {
    renderNav();

    expect(link('Home')).toBeTruthy();
    expect(link('Sign up')).toBeTruthy();
    expect(link('Sign in')).toBeTruthy();
    expect(button('Log out')).toBeNull();
    expect(link('Admin')).toBeNull();
  });

  test('signed in: shows Log out instead of Sign up and Sign in, and no Admin', () => {
    localStorage.setItem('token', makeToken({ role: 'user' }));
    renderNav();

    expect(link('Home')).toBeTruthy();
    expect(button('Log out')).toBeTruthy();
    expect(link('Sign up')).toBeNull();
    expect(link('Sign in')).toBeNull();
    expect(link('Admin')).toBeNull();
  });

  test('signed in as an admin: also shows the Admin link', () => {
    localStorage.setItem('token', makeToken({ role: 'admin' }));
    renderNav();

    expect(link('Admin')).toBeTruthy();
    expect(button('Log out')).toBeTruthy();
  });

  test('the role name is not case sensitive', () => {
    localStorage.setItem('token', makeToken({ role: 'Admin' }));
    renderNav();

    expect(link('Admin')).toBeTruthy();
  });

  test('an expired token counts as signed out', () => {
    localStorage.setItem('token', makeToken({ expiresInSeconds: -60 }));
    renderNav();

    expect(link('Sign in')).toBeTruthy();
    expect(button('Log out')).toBeNull();
  });

  test('Log out removes the token and returns to the login page', () => {
    localStorage.setItem('token', makeToken({ role: 'admin' }));
    renderNav();

    fireEvent.click(button('Log out'));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
  });
});

describe('Nav inside the real app', () => {
  function renderApp() {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
  }

  test('an administrator sees the Admin link in the header of the landing page', () => {
    localStorage.setItem('token', makeToken({ role: 'admin' }));
    renderApp();

    expect(link('Admin')).toBeTruthy();
  });

  test('a normal user does not see the Admin link in the header of the landing page', () => {
    localStorage.setItem('token', makeToken({ role: 'user' }));
    renderApp();

    expect(link('Admin')).toBeNull();
    expect(button('Log out')).toBeTruthy();
  });
});
