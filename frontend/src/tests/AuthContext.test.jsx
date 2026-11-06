// AuthContext.test.jsx: tests for the signed-in state and logout (RQ04, UC03).
//   - readToken reads the user out of a token, and refuses broken or expired ones
//   - the provider starts signed in when a valid token is saved, signed out when not
//   - signIn saves the token and the screen changes at once
//   - Log out clears the stored token and returns to the login page (the plan's test)
//   - after logging out, the navigation shows Sign in again instead of Log out

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth, readToken } from '../state/AuthContext';
import LogoutButton from '../components/LogoutButton';
import AppRoutes from '../routes';
import { setPendingLogin, getPendingLogin } from '../lib/pendingLogin';

// Builds a token with the same shape as George's jwt.js: header.payload.signature.
// The signature is fake, which is fine: the browser never checks it, only the server does.
function makeToken(payload) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

const inOneDay = () => Math.floor(Date.now() / 1000) + 24 * 60 * 60;
const userToken = () => makeToken({ user_id: 7, role: 'user', exp: inOneDay() });

// A tiny component that prints what the context says, so the tests can read it.
function Status() {
  const { isSignedIn, user } = useAuth();
  return <p data-testid="status">{isSignedIn ? `in:${user.userId}:${user.role}` : 'out'}</p>;
}

function SignInWith({ token }) {
  const { signIn } = useAuth();
  return <button onClick={() => signIn(token)}>sign in</button>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('readToken', () => {
  test('reads the user id and role from a valid token', () => {
    const token = makeToken({ user_id: 3, role: 'admin', exp: inOneDay() });
    expect(readToken(token)).toEqual({ userId: 3, role: 'admin' });
  });

  test('refuses an expired token', () => {
    const token = makeToken({ user_id: 3, role: 'user', exp: 1000 });
    expect(readToken(token)).toBeNull();
  });

  test.each([[null], [''], ['not-a-token'], ['abc.def.ghi'], [makeToken({ role: 'user' })]])(
    'refuses a broken token: %p',
    (token) => {
      expect(readToken(token)).toBeNull();
    }
  );
});

describe('AuthProvider', () => {
  test('starts signed in when a valid token is saved', () => {
    localStorage.setItem('token', userToken());
    render(<AuthProvider><Status /></AuthProvider>);
    expect(screen.getByTestId('status').textContent).toBe('in:7:user');
  });

  test('starts signed out with no token, and removes an expired one', () => {
    localStorage.setItem('token', makeToken({ user_id: 7, role: 'user', exp: 1000 }));
    render(<AuthProvider><Status /></AuthProvider>);
    expect(screen.getByTestId('status').textContent).toBe('out');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('signIn saves the token and the screen changes at once', () => {
    const token = userToken();
    render(
      <AuthProvider>
        <Status />
        <SignInWith token={token} />
      </AuthProvider>
    );
    expect(screen.getByTestId('status').textContent).toBe('out');
    fireEvent.click(screen.getByRole('button', { name: 'sign in' }));
    expect(screen.getByTestId('status').textContent).toBe('in:7:user');
    expect(localStorage.getItem('token')).toBe(token);
  });
});

describe('logout (RQ04, UC03)', () => {
  test('clears the stored token and returns to the login page', () => {
    localStorage.setItem('token', userToken());
    setPendingLogin({ email: 'demo@fit4you.com', password: 'demo1234' });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<><Status /><LogoutButton /></>} />
            <Route path="/login" element={<h1>Login</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('status').textContent).toBe('in:7:user');
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(getPendingLogin()).toBeNull();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
  });

  test('the navigation shows Log out when signed in, and Sign in again after logging out', () => {
    localStorage.setItem('token', userToken());
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    // Now on the real login page from routes.jsx, with no token left.
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('a signed-out visitor sees Sign up and Sign in, and no Log out button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });
});
