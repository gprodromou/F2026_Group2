// AppShell.test.jsx: tests for the frame of the signed-in screens (NFR02, NFR05):
// the logo, the three-line slide-out menu, the title and the footer.

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { AuthProvider } from '../state/AuthContext';

function makeToken(role = 'user') {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 7, role, exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

function renderShell(role = 'user') {
  localStorage.clear();
  localStorage.setItem('token', makeToken(role));
  return render(
    <MemoryRouter initialEntries={['/workouts']}>
      <AuthProvider>
        <Routes>
          <Route path="/workouts" element={<AppShell title="Workout History"><p>Page content</p></AppShell>} />
          <Route path="/workouts/new" element={<p>Workout entry page</p>} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

const menuButton = () => screen.getByRole('button', { name: 'Open menu' });
const menu = () => screen.queryByRole('navigation', { name: 'Site menu' });

// Week 7 (Yanna): the header is the logo + the slide-out menu (SiteMenu), the same as Layout.
describe('AppShell', () => {
  test('shows the logo, the title, the page and the menu button, with the menu closed', () => {
    renderShell();
    expect(screen.getByRole('link', { name: 'fit4you' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('heading', { name: 'Workout History' })).toBeTruthy();
    expect(screen.getByText('Page content')).toBeTruthy();
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(menu()).toBeNull();
  });

  test('the three-line button opens the menu with the signed-in links and Log out', () => {
    renderShell();
    fireEvent.click(menuButton());

    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    const nav = menu();
    expect(nav.textContent).toContain('Home');
    expect(nav.textContent).toContain('Log Workout');
    expect(nav.textContent).toContain('History');
    expect(nav.textContent).toContain('Goals');
    expect(screen.getByRole('button', { name: /log out/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
  });

  test('an administrator also sees the Admin link', () => {
    renderShell('admin');
    fireEvent.click(menuButton());
    expect(screen.getByRole('link', { name: 'Admin' })).toBeTruthy();
  });

  test('choosing a link goes to that page', () => {
    renderShell();
    fireEvent.click(menuButton());
    fireEvent.click(screen.getByRole('link', { name: 'Log Workout' }));
    expect(screen.getByText('Workout entry page')).toBeTruthy();
  });

  test('Escape closes the menu and the button gets the focus back', () => {
    renderShell();
    fireEvent.click(menuButton());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(menuButton());
  });

  test('clicking the dark area beside the menu closes it', () => {
    const { container } = renderShell();
    fireEvent.click(menuButton());
    fireEvent.click(container.querySelector('.site-menu__overlay'));
    expect(menu()).toBeNull();
  });

  test('Log out in the menu signs the user out', () => {
    renderShell();
    fireEvent.click(menuButton());
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(screen.getByText('Login page')).toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('the footer has the logo, the copyright and the four social links', () => {
    renderShell();
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toContain('fit4you');
    expect(footer.textContent).toContain('Copyright © 2026 fit4you. All rights reserved.');
    ['Facebook', 'Instagram', 'LinkedIn', 'YouTube'].forEach((name) => {
      expect(screen.getByRole('link', { name })).toBeTruthy();
    });
  });
});
