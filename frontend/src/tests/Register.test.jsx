// Register.test.jsx: tests for the two-step registration screen (RQ01, RQ02, UC01).
// fetch is replaced by a fake, so no server is needed.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Register from '../pages/Register';

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

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Signed-in home</p>} />
      </Routes>
    </MemoryRouter>
  );
}

const type = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillStep1(overrides = {}) {
  const v = { name: 'Test User', email: 'test@example.com', password: 'password123', confirm: 'password123', ...overrides };
  type('Full name', v.name);
  type('Email address', v.email);
  type('Password', v.password);
  type('Confirm password', v.confirm);
}

function fillStep2() {
  type('Height (whole)', '170');
  type('Weight (whole)', '70');
  type('Month', '3');
  type('Day', '15');
  type('Year', '1998');
}

const press = (name) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  localStorage.clear();
});

describe('Register step 1', () => {
  test('empty fields show messages and stay on step 1', () => {
    renderRegister();
    press('Continue');

    expect(screen.getByText('Name is required')).toBeTruthy();
    expect(screen.getByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Register' })).toBeTruthy();
  });

  test('passwords that do not match are refused', () => {
    renderRegister();
    fillStep1({ confirm: 'different123' });
    press('Continue');

    expect(screen.getByText('The passwords do not match')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Register' })).toBeTruthy();
  });

  test('a password shorter than 8 characters is refused', () => {
    renderRegister();
    fillStep1({ password: 'short', confirm: 'short' });
    press('Continue');

    expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
  });

  test('valid details move to step 2', () => {
    renderRegister();
    fillStep1();
    press('Continue');

    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeTruthy();
  });
});

describe('Register step 2', () => {
  function goToStep2() {
    renderRegister();
    fillStep1();
    press('Continue');
  }

  test('Back returns to step 1 and keeps what was typed', () => {
    goToStep2();
    press('Back');

    expect(screen.getByRole('heading', { name: 'Register' })).toBeTruthy();
    expect(screen.getByLabelText('Full name').value).toBe('Test User');
    expect(screen.getByLabelText('Email address').value).toBe('test@example.com');
  });

  test('missing statistics show messages and nothing is sent', () => {
    mockFetch();
    goToStep2();
    press('Complete');

    expect(screen.getByText('Height must be a number')).toBeTruthy();
    expect(screen.getByText('Weight must be a number')).toBeTruthy();
    expect(screen.getByText('Date of birth is required')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a date that does not exist is refused', () => {
    mockFetch();
    goToStep2();
    fillStep2();
    type('Month', '2');
    type('Day', '31');
    press('Complete');

    expect(screen.getByText('Date of birth is not a valid date')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a date in the future is refused', () => {
    mockFetch();
    goToStep2();
    fillStep2();
    type('Year', '2999');
    press('Complete');

    expect(screen.getByText('Date of birth cannot be in the future')).toBeTruthy();
  });
});

describe('Register complete', () => {
  test('a valid form creates the account, logs in, saves the token and goes home', async () => {
    mockFetch({ status: 201, body: { userId: 1 } }, { status: 200, body: { token: 'abc.def.ghi' } });
    renderRegister();
    fillStep1();
    press('Continue');
    fillStep2();
    press('Complete');

    expect(await screen.findByText('Signed-in home')).toBeTruthy();
    expect(localStorage.getItem('token')).toBe('abc.def.ghi');

    const [registerUrl, registerOptions] = global.fetch.mock.calls[0];
    expect(registerUrl).toBe('/auth/register');
    expect(JSON.parse(registerOptions.body)).toEqual({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      dateOfBirth: '1998-03-15',
      height: 170,
      weight: 70,
    });
    expect(global.fetch.mock.calls[1][0]).toBe('/auth/login');
  });

  test('whole and decimal boxes are combined and converted to cm and kg', async () => {
    mockFetch({ status: 201, body: { userId: 1 } }, { status: 200, body: { token: 't' } });
    renderRegister();
    fillStep1();
    press('Continue');
    fillStep2();
    type('Height (whole)', '5');
    type('Height (decimal)', '5');
    type('Height units', 'ft');
    type('Weight (whole)', '154');
    type('Weight units', 'lb');
    press('Complete');

    await screen.findByText('Signed-in home');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.height).toBe(167.6); // 5.5 ft
    expect(body.weight).toBe(69.9);  // 154 lb
  });

  test('an email that is already registered sends the user back to step 1 with the error', async () => {
    mockFetch({ status: 409, body: { error: 'This email is already registered' } });
    renderRegister();
    fillStep1();
    press('Continue');
    fillStep2();
    press('Complete');

    expect(await screen.findByText('This email is already registered')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Register' })).toBeTruthy();
    expect(screen.getByLabelText('Email address').value).toBe('test@example.com');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('a server that cannot be reached shows a message and keeps the form', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    renderRegister();
    fillStep1();
    press('Continue');
    fillStep2();
    press('Complete');

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/cannot reach the server/i));
    expect(screen.getByLabelText('Height (whole)').value).toBe('170');
  });
});
