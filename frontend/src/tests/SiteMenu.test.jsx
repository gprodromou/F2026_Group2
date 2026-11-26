// SiteMenu.test.jsx: tests for the three-line menu on the Login / Register frame (Yanna, week 7).
//   - the menu starts closed and opens when the three-line button is clicked
//   - it lists Home, About, Services, Contact us and Log in, with the right addresses
//   - Escape and the X close it
//   - choosing Home goes back to the home page
//   - the menu also has a Register button under Log in
//   - signed in, it has the app links (and Admin for administrators) and Log out
//   - step 1 of Register no longer has a Back button (the menu replaces it)
//   - every field on step 1 of Register is marked as required

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../routes';
import { AuthProvider } from '../state/AuthContext';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

// A fake login token, the same way Nav.test.jsx makes one (AuthContext reads it like a JWT).
function makeToken(role = 'user') {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 1, role, exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

const menuButton = () => screen.getByRole('button', { name: 'Open menu' });
const siteMenu = () => screen.queryByRole('navigation', { name: 'Site menu' });

beforeEach(() => {
  localStorage.clear();
});

describe('SiteMenu', () => {
  test('starts closed and opens with the three-line button', () => {
    renderAt('/register');

    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(siteMenu()).toBeNull(); // hidden from screen readers while closed

    fireEvent.click(menuButton());

    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(siteMenu()).toBeTruthy();
  });

  test('lists Home, About, Services, Contact us and Log in', () => {
    renderAt('/register');
    fireEvent.click(menuButton());

    const expected = {
      Home: '/',
      About: '/#about',
      Services: '/#services',
      'Contact us': '/#contact',
    };
    Object.entries(expected).forEach(([name, href]) => {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(href);
    });
    // "Log in" also appears under the form ("Already have an account? Log in"),
    // so look for the one inside the menu panel.
    const logIns = screen.getAllByRole('link', { name: 'Log in' });
    expect(logIns.some((link) => link.closest('.site-menu__panel'))).toBe(true);
  });

  test('has a Register button under Log in', () => {
    renderAt('/login');
    fireEvent.click(menuButton());

    const register = screen.getByRole('link', { name: 'Register' });
    expect(register.getAttribute('href')).toBe('/register');
    expect(register.closest('.site-menu__panel')).toBeTruthy();
  });

  test('signed in: the menu has the app links and Log out instead of Log in', () => {
    localStorage.setItem('token', makeToken());
    renderAt('/login');
    fireEvent.click(menuButton());

    const menu = siteMenu();
    expect(menu.textContent).toContain('Log Workout');
    expect(menu.textContent).toContain('History');
    expect(menu.textContent).toContain('Goals');
    expect(menu.textContent).not.toContain('Admin');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Register' })).toBeNull();
  });

  test('signed in: "Turn on 2FA" in the menu opens the two-factor setup screen', () => {
    localStorage.setItem('token', makeToken());
    renderAt('/login');
    fireEvent.click(menuButton());

    const twoFactor = screen.getByRole('link', { name: 'Turn on 2FA' });
    expect(twoFactor.getAttribute('href')).toBe('/two-factor/setup');
    expect(twoFactor.closest('.site-menu__panel')).toBeTruthy();
  });

  test('signed out: there is no "Turn on 2FA" (it needs an account)', () => {
    renderAt('/login');
    fireEvent.click(menuButton());
    expect(screen.queryByRole('link', { name: 'Turn on 2FA' })).toBeNull();
  });

  test('administrators do not get "Turn on 2FA" (the server refuses 2FA for them: 403)', () => {
    localStorage.setItem('token', makeToken('admin'));
    renderAt('/login');
    fireEvent.click(menuButton());

    expect(screen.getByRole('link', { name: 'Admin' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Turn on 2FA' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
  });

  test('an administrator also gets Admin in the menu', () => {
    localStorage.setItem('token', makeToken('admin'));
    renderAt('/login');
    fireEvent.click(menuButton());

    expect(screen.getByRole('link', { name: 'Admin' })).toBeTruthy();
  });

  test('Escape closes the menu', () => {
    renderAt('/login');
    fireEvent.click(menuButton());
    expect(siteMenu()).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(siteMenu()).toBeNull();
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
  });

  test('the X closes the menu', () => {
    renderAt('/login');
    fireEvent.click(menuButton());

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));

    expect(siteMenu()).toBeNull();
  });

  test('choosing Home goes back to the home page', () => {
    renderAt('/register');
    fireEvent.click(menuButton());

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));

    // The landing page's (screen-reader) heading, and the main header is back.
    expect(screen.getByRole('heading', { name: /^fit4you$/i })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
  });

  test('step 1 of Register has no Back button, only Continue', () => {
    renderAt('/register');

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });

  test('every field on step 1 of Register is marked as required', () => {
    renderAt('/register');

    ['Full name', 'Email address', 'Password', 'Confirm password'].forEach((label) => {
      const input = screen.getByLabelText(label);
      expect(input.required).toBe(true);                                   // announced as required
      expect(input.closest('.field').className).toContain('field--required'); // shows the red *
    });
  });
});
