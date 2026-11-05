// TwoFactorSetup.test.jsx: tests for the two-factor setup screen after sign-up (UC14).
// fetch is replaced by a fake, so no server is needed.

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TwoFactorSetup from '../pages/TwoFactorSetup';

const SECRET = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
const OTPAUTH = `otpauth://totp/Fit4You:test%40example.com?secret=${SECRET}&issuer=Fit4You`;

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

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/two-factor/setup']}>
      <Routes>
        <Route path="/two-factor/setup" element={<TwoFactorSetup />} />
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
  localStorage.setItem('token', 'test.token');
});

describe('TwoFactorSetup', () => {
  test('without a token it sends the user to the login page', () => {
    localStorage.clear();
    mockFetch();
    renderSetup();

    expect(screen.getByText('Login page')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('it asks the server for a secret with the token, then shows the QR code and the key', async () => {
    mockFetch({ status: 200, body: { secret: SECRET, otpauthUrl: OTPAUTH } });
    const { container } = renderSetup();

    expect(await screen.findByText(SECRET)).toBeTruthy();
    expect(container.querySelector('svg')).toBeTruthy();

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/auth/2fa/setup');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test.token');
  });

  test('a token the server no longer accepts sends the user to the login page', async () => {
    mockFetch({ status: 401, body: { error: 'Invalid or expired token' } });
    renderSetup();

    expect(await screen.findByText('Login page')).toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('a code that is not 6 digits is refused and not sent', async () => {
    mockFetch({ status: 200, body: { secret: SECRET, otpauthUrl: OTPAUTH } });
    renderSetup();
    await screen.findByText(SECRET);

    typeCode('12');
    press('Turn on');

    expect(screen.getByText('Enter the 6-digit code from your app')).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1); // only the setup call
  });

  test('a wrong first code shows an error in place and keeps what was typed', async () => {
    mockFetch(
      { status: 200, body: { secret: SECRET, otpauthUrl: OTPAUTH } },
      { status: 400, body: { error: 'Wrong 2FA code' } }
    );
    renderSetup();
    await screen.findByText(SECRET);

    typeCode('000000');
    press('Turn on');

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong 2FA code');
    expect(screen.getByLabelText('Authentication code').value).toBe('000000');
  });

  test('the right first code turns two-factor login on and goes to the signed-in page', async () => {
    mockFetch(
      { status: 200, body: { secret: SECRET, otpauthUrl: OTPAUTH } },
      { status: 200, body: { message: '2FA is now on' } }
    );
    renderSetup();
    await screen.findByText(SECRET);

    typeCode('482913');
    press('Turn on');

    expect(await screen.findByText('Signed-in home')).toBeTruthy();
    const [url, options] = global.fetch.mock.calls[1];
    expect(url).toBe('/auth/2fa/enable');
    expect(options.headers.Authorization).toBe('Bearer test.token');
    expect(JSON.parse(options.body)).toEqual({ code: '482913' });
  });
});
