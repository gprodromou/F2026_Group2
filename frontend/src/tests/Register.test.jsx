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
        <Route path="/two-factor/setup" element={<p>Two-factor setup page</p>} />
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

  test('the password rule is shown under the box and ticks once it is met', () => {
    renderRegister();
    const hint = () => screen.getByText('At least 8 characters').closest('.field__hint');

    expect(hint().className).not.toContain('field__hint--met');
    expect(screen.getByLabelText('Password').getAttribute('aria-describedby')).toBe('password-hint');

    type('Password', 'longenough');
    expect(hint().className).toContain('field__hint--met');
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

  // Week 7 (Yanna): step 2 has no Back button any more, only Complete.
  test('step 2 has no Back button', () => {
    goToStep2();

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Complete' })).toBeTruthy();
  });

  test('height in cm has no decimal box; m and ft do, and weight always does', () => {
    goToStep2();

    expect(screen.queryByLabelText('Height (decimal)')).toBeNull(); // cm is the default
    expect(screen.getByLabelText('Weight (decimal)')).toBeTruthy();

    type('Height units', 'm');
    expect(screen.getByLabelText('Height (decimal)')).toBeTruthy();
    type('Height units', 'ft');
    expect(screen.getByLabelText('Height (decimal)')).toBeTruthy();
    type('Height units', 'cm');
    expect(screen.queryByLabelText('Height (decimal)')).toBeNull();
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

  // Week 7 (Yanna): the birthday is three dropdowns (Day, Month, Year) and a calendar.
  test('the birthday dropdowns: Day, Month written out, Year', () => {
    goToStep2();

    const month = screen.getByLabelText('Month');
    expect(month.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: 'March' }).value).toBe('3'); // name shown, number sent
    expect(screen.getByLabelText('Day').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Year').tagName).toBe('SELECT');
  });

  test('the day list follows the month, and an impossible day is cleared', () => {
    goToStep2();
    type('Day', '31');
    type('Year', '1998');
    type('Month', '2'); // February 1998 has 28 days

    expect(screen.getByLabelText('Day').value).toBe(''); // 31 February is not possible
    const days = screen.getByLabelText('Day').querySelectorAll('option:not([value=""])');
    expect(days.length).toBe(28);
  });

  describe('age', () => {
    // Freeze "today" so the year list and the age check do not change with the real date.
    beforeEach(() => jest.useFakeTimers({ now: new Date('2026-06-15T12:00:00') }));
    afterEach(() => jest.useRealTimers());

    test('the newest year in the list is 16 years ago', () => {
      goToStep2();
      const years = Array.from(screen.getByLabelText('Year').querySelectorAll('option'))
        .map((option) => option.value)
        .filter(Boolean);

      expect(years[0]).toBe('2010');
      expect(years).not.toContain('2011');
    });

    test('someone who turns 16 later this year is refused', () => {
      mockFetch();
      goToStep2();
      fillStep2();
      type('Year', '2010');
      type('Month', '12');
      type('Day', '1');
      press('Complete');

      expect(screen.getByText('You must be at least 16 to register')).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  test('choosing a date in the calendar fills the three dropdowns', () => {
    goToStep2();
    fireEvent.change(screen.getByLabelText('Choose from a calendar'), { target: { value: '1998-03-15' } });

    expect(screen.getByLabelText('Day').value).toBe('15');
    expect(screen.getByLabelText('Month').value).toBe('3');
    expect(screen.getByLabelText('Year').value).toBe('1998');
  });
});

describe('Register complete', () => {
  test('a valid form creates the account, logs in, saves the token and goes to the two-factor setup', async () => {
    mockFetch({ status: 201, body: { userId: 1 } }, { status: 200, body: { token: 'abc.def.ghi' } });
    renderRegister();
    fillStep1();
    press('Continue');
    fillStep2();
    press('Complete');

    expect(await screen.findByText('Two-factor setup page')).toBeTruthy();
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
    type('Height units', 'ft'); // first: the decimal box only appears for m and ft
    type('Height (whole)', '5');
    type('Height (decimal)', '5');
    type('Weight (whole)', '154');
    type('Weight units', 'lb');
    press('Complete');

    await screen.findByText('Two-factor setup page');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.height).toBe(167.6); // 5.5 ft
    expect(body.weight).toBe(69.9);  // 154 lb
  });

  test('metres are converted to cm, and an empty decimal box is fine', async () => {
    mockFetch({ status: 201, body: { userId: 1 } }, { status: 200, body: { token: 't' } });
    renderRegister();
    fillStep1();
    press('Continue');
    fillStep2();
    type('Height units', 'm');
    type('Height (whole)', '1');
    type('Height (decimal)', '75');
    type('Weight (whole)', '70'); // weight decimal left empty on purpose
    press('Complete');

    await screen.findByText('Two-factor setup page');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.height).toBe(175); // 1.75 m
    expect(body.weight).toBe(70);
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
