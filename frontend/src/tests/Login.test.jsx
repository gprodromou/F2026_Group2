// Login.test.jsx: tests for the login screen (RQ03, UC02).
// fetch is replaced by a fake, so no server is needed.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';

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

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Signed-in home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillAndSubmit(email, password) {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
}

beforeEach(() => {
  localStorage.clear();
});

describe('Login', () => {
  test('a wrong password shows an error in place and keeps what was typed', async () => {
    mockFetch({ status: 401, body: { error: 'Wrong email or password' } });
    renderLogin();

    fillAndSubmit('demo@example.com', 'wrongpassword');

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong email or password');
    expect(screen.getByLabelText('Email address').value).toBe('demo@example.com');
    expect(screen.getByLabelText('Password').value).toBe('wrongpassword');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('correct details save the token and go to the signed-in page', async () => {
    mockFetch({ status: 200, body: { token: 'abc.def.ghi' } });
    renderLogin();

    fillAndSubmit('demo@example.com', 'demo1234');

    expect(await screen.findByText('Signed-in home')).toBeTruthy();
    expect(localStorage.getItem('token')).toBe('abc.def.ghi');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/auth/login');
    expect(JSON.parse(options.body)).toEqual({ email: 'demo@example.com', password: 'demo1234' });
  });

  test('empty fields show messages and nothing is sent', () => {
    mockFetch();
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(screen.getByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a server that cannot be reached shows a message and keeps what was typed', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    renderLogin();

    fillAndSubmit('demo@example.com', 'demo1234');

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/cannot reach the server/i));
    expect(screen.getByLabelText('Email address').value).toBe('demo@example.com');
  });
});
