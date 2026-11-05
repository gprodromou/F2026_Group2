// TwoFactorVerify.test.jsx: tests for the code screen after login (UC02, UC14).
// fetch is replaced by a fake, so no server is needed.

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TwoFactorVerify from '../pages/TwoFactorVerify';
import { setPendingLogin, getPendingLogin, clearPendingLogin } from '../lib/pendingLogin';

function mockFetch(...responses) {
  global.fetch = jest.fn();
  responses.forEach((r) =>
    global.fetch.mockResolvedValueOnce({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
    })
  );
}

function renderVerify() {
  return render(
    <MemoryRouter initialEntries={['/two-factor/verify']}>
      <Routes>
        <Route path="/two-factor/verify" element={<TwoFactorVerify />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Signed-in home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

const typeCode = (value) =>
  fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value } });
const press = (name) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  localStorage.clear();
  clearPendingLogin();
});

describe('TwoFactorVerify', () => {
  test('opened without a login in progress, it sends the user to the login page', () => {
    renderVerify();
    expect(screen.getByText('Login page')).toBeTruthy();
  });

  test('a code that is not 6 digits is refused and nothing is sent', () => {
    setPendingLogin({ email: 'demo@example.com', password: 'demo1234' });
    mockFetch();
    renderVerify();

    typeCode('123');
    press('Verify');

    expect(screen.getByText('Enter the 6-digit code from your app')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a wrong code shows an error in place and keeps what was typed', async () => {
    setPendingLogin({ email: 'demo@example.com', password: 'demo1234' });
    mockFetch({ status: 401, body: { error: 'Wrong 2FA code' } });
    renderVerify();

    typeCode('000000');
    press('Verify');

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong 2FA code');
    expect(screen.getByLabelText('Authentication code').value).toBe('000000');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('the right code saves the token, forgets the password and goes to the signed-in page', async () => {
    setPendingLogin({ email: 'demo@example.com', password: 'demo1234' });
    mockFetch({ status: 200, body: { token: 'abc.def.ghi' } });
    renderVerify();

    typeCode('482913');
    press('Verify');

    expect(await screen.findByText('Signed-in home')).toBeTruthy();
    expect(localStorage.getItem('token')).toBe('abc.def.ghi');
    expect(getPendingLogin()).toBeNull();

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/auth/login');
    expect(JSON.parse(options.body)).toEqual({
      email: 'demo@example.com',
      password: 'demo1234',
      code: '482913',
    });
  });

  test('Back forgets the login in progress and returns to the login page', () => {
    setPendingLogin({ email: 'demo@example.com', password: 'demo1234' });
    renderVerify();

    press('Back');

    expect(screen.getByText('Login page')).toBeTruthy();
    expect(getPendingLogin()).toBeNull();
  });
});
