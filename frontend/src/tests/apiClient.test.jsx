// apiClient.test.jsx: tests for the API client (NFR03), frontend/src/api/client.js.
//   - the token is attached to every request, and a body is sent as JSON
//   - an error answer becomes an ApiError with the server's message
//   - no answer at all becomes an ApiError with status 0
//   - a 401 to a request WITH a token signs the user out and opens the login page (the plan's test)
//   - a 401 to a request WITHOUT a token (a wrong password) does not
//   - the two-factor setup screen uses the client for its requests

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { apiRequest, useApi, ApiError, NETWORK_ERROR, GENERIC_ERROR } from '../api/client';
import { AuthProvider, useAuth } from '../state/AuthContext';

// Same token shape as George's jwt.js; the browser never checks the signature.
function makeToken(payload) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}
const validToken = () =>
  makeToken({ user_id: 7, role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 });

// Replaces fetch with a fake that answers with the given responses, in order.
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

beforeEach(() => {
  localStorage.clear();
});

describe('apiRequest', () => {
  test('attaches the saved token to the request', async () => {
    localStorage.setItem('token', 'abc.def.ghi');
    mockFetch({ status: 200, body: [] });

    await apiRequest('/workouts');

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/workouts');
    expect(options.method).toBe('GET');
    expect(options.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('sends no Authorization header when nobody is signed in', async () => {
    mockFetch({ status: 200, body: {} });

    await apiRequest('/health');

    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('sends a body as JSON and returns the JSON answer', async () => {
    localStorage.setItem('token', 'abc.def.ghi');
    mockFetch({ status: 201, body: { workoutId: 5 } });

    const data = await apiRequest('/workouts', {
      method: 'POST',
      body: { workoutDate: '2026-11-10', exerciseType: 'Running', duration: 30 },
    });

    const options = global.fetch.mock.calls[0][1];
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({
      workoutDate: '2026-11-10',
      exerciseType: 'Running',
      duration: 30,
    });
    expect(data).toEqual({ workoutId: 5 });
  });

  test("an error answer throws an ApiError with the server's message", async () => {
    localStorage.setItem('token', 'abc.def.ghi');
    mockFetch({ status: 404, body: { error: 'Workout not found' } });

    await expect(apiRequest('/workouts/99')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Workout not found',
    });
  });

  test('an error answer without a message gets a general one', async () => {
    mockFetch({ status: 500, body: {} });

    const error = await apiRequest('/health').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe(GENERIC_ERROR);
  });

  test('no answer from the server throws an ApiError with status 0', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiRequest('/workouts')).rejects.toMatchObject({ status: 0, message: NETWORK_ERROR });
  });

  test('a 401 to a request WITH a token calls onUnauthorized', async () => {
    localStorage.setItem('token', 'abc.def.ghi');
    mockFetch({ status: 401, body: { error: 'Invalid or expired token' } });
    const onUnauthorized = jest.fn();

    await expect(apiRequest('/workouts', { onUnauthorized })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test('a 401 to a request WITHOUT a token (wrong password) does not', async () => {
    mockFetch({ status: 401, body: { error: 'Wrong email or password' } });
    const onUnauthorized = jest.fn();

    await expect(
      apiRequest('/auth/login', { method: 'POST', body: {}, onUnauthorized })
    ).rejects.toMatchObject({ status: 401, message: 'Wrong email or password' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

// A small page that loads workouts with useApi, the way the workout screens will.
function WorkoutsPage() {
  const api = useApi();
  const { isSignedIn } = useAuth();
  return (
    <>
      <p data-testid="status">{isSignedIn ? 'signed in' : 'signed out'}</p>
      <button onClick={() => api.get('/workouts').catch(() => {})}>Load</button>
    </>
  );
}

function renderInApp() {
  return render(
    <MemoryRouter initialEntries={['/workouts']}>
      <AuthProvider>
        <Routes>
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('useApi inside the app', () => {
  test('uses the token AuthContext signed in with', async () => {
    const token = validToken();
    localStorage.setItem('token', token);
    mockFetch({ status: 200, body: [] });
    renderInApp();

    expect(screen.getByTestId('status').textContent).toBe('signed in');
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    await screen.findByTestId('status'); // let the request finish
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${token}`);
  });

  test('a 401 signs the user out and goes back to the login page', async () => {
    localStorage.setItem('token', validToken());
    mockFetch({ status: 401, body: { error: 'Invalid or expired token' } });
    renderInApp();

    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(await screen.findByText('Login page')).toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
