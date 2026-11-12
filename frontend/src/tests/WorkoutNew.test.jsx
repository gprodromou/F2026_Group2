// WorkoutNew.test.jsx: tests for the workout entry screen (RQ06, UC05, NFR04, NFR06).
// fetch is replaced by a fake, so no server is needed. A fake login token stands in for
// "signed in" and the real AuthProvider reads it, as it does in the app. The workout is sent
// through the real API client (api/client.js), so the token header and the 401 handling are tested too.

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WorkoutNew from '../pages/WorkoutNew';
import { AuthProvider } from '../state/AuthContext';

function makeToken() {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 7, role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

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

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/workouts/new']}>
      <AuthProvider>
        <Routes>
          <Route path="/workouts/new" element={<WorkoutNew />} />
          <Route path="/workouts" element={<p>Workout history</p>} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

const set = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const press = (name) => fireEvent.click(screen.getByRole('button', { name }));

function fillValid(overrides = {}) {
  const v = {
    date: '2026-11-10',
    minutes: '45',
    calories: '400',
    type: 'Strength & Resistance',
    equipment: 'Dumbbells',
    ...overrides,
  };
  set('Date', v.date);
  set('Minutes', v.minutes);
  set('Calories (kcal)', v.calories);
  set('Type of workout', v.type);
  set('Equipment used', v.equipment);
}

let token;

beforeEach(() => {
  localStorage.clear();
  token = makeToken();
  localStorage.setItem('token', token);
});

describe('WorkoutNew', () => {
  test('a visitor who is not signed in is sent to the login page', () => {
    localStorage.clear();
    renderScreen();
    expect(screen.getByText('Login page')).toBeTruthy();
  });

  test('the Stats heading and the whole form are on one screen', () => {
    renderScreen();
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeTruthy();
    expect(screen.getByLabelText('Type of workout')).toBeTruthy();
    expect(screen.getByLabelText('Equipment used')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save workout' })).toBeTruthy();
  });

  test('the type list has the six workout types and Other', () => {
    renderScreen();
    const options = Array.from(screen.getByLabelText('Type of workout').options).map((o) => o.value);
    expect(options).toEqual([
      '',
      'Cardiovascular',
      'Strength & Resistance',
      'HIIT',
      'Flexibility & Mobility',
      'Balance & Stability',
      'Functional Training',
      'Other',
    ]);
  });

  test('an empty form shows messages and sends nothing', () => {
    mockFetch();
    renderScreen();
    press('Save workout');

    expect(screen.getByText('Duration must be greater than 0')).toBeTruthy();
    expect(screen.getByText('Calories must be a number')).toBeTruthy();
    expect(screen.getByText('Choose a workout type')).toBeTruthy();
    expect(screen.getByText('Choose the equipment you used')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a date in the future is refused', () => {
    mockFetch();
    renderScreen();
    fillValid({ date: '2999-01-01' });
    press('Save workout');

    expect(screen.getByText('Date cannot be in the future')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('negative calories are refused', () => {
    mockFetch();
    renderScreen();
    fillValid({ calories: '-5' });
    press('Save workout');

    expect(screen.getByText('Calories cannot be negative')).toBeTruthy();
  });

  test('Other opens an input bar for the type, and it must be filled in', () => {
    mockFetch();
    renderScreen();
    expect(screen.queryByLabelText('Your workout type')).toBeNull();

    fillValid({ type: 'Other' });
    expect(screen.getByLabelText('Your workout type')).toBeTruthy();

    press('Save workout');
    expect(screen.getByText('Your workout type is required')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('Other opens an input bar for the equipment, and it must be filled in', () => {
    mockFetch();
    renderScreen();
    fillValid({ equipment: 'Other' });
    expect(screen.getByLabelText('Your equipment')).toBeTruthy();

    press('Save workout');
    expect(screen.getByText('Your equipment is required')).toBeTruthy();
  });

  test('a valid workout is sent with the token and no user id, then the history opens', async () => {
    mockFetch({ status: 201, body: { workoutId: 1 } });
    renderScreen();
    fillValid();
    press('Save workout');

    expect(await screen.findByText('Workout history')).toBeTruthy();

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/workouts');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe(`Bearer ${token}`);
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      workoutDate: '2026-11-10',
      exerciseType: 'Strength & Resistance',
      duration: 45,
      caloriesBurned: 400,
      equipmentUsed: 'Dumbbells',
    });
    expect(body.user_id).toBeUndefined();
    expect(body.userId).toBeUndefined();
  });

  test('hours, minutes and seconds are combined into whole minutes, rounded up', async () => {
    mockFetch({ status: 201, body: { workoutId: 1 } });
    renderScreen();
    fillValid({ minutes: '30' });
    set('Hours', '1');
    set('Seconds', '30');
    press('Save workout');

    await screen.findByText('Workout history');
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).duration).toBe(91); // 1 h 30 min 30 s
  });

  test('the text typed under Other is what is sent', async () => {
    mockFetch({ status: 201, body: { workoutId: 1 } });
    renderScreen();
    fillValid({ type: 'Other', equipment: 'Other' });
    set('Your workout type', '  Boxing ');
    set('Your equipment', 'Battle ropes');
    press('Save workout');

    await screen.findByText('Workout history');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.exerciseType).toBe('Boxing');
    expect(body.equipmentUsed).toBe('Battle ropes');
  });

  test('a server refusal shows the message and keeps everything typed', async () => {
    mockFetch({ status: 400, body: { error: 'Duration must be greater than 0' } });
    renderScreen();
    fillValid();
    press('Save workout');

    expect((await screen.findByRole('alert')).textContent).toBe('Duration must be greater than 0');
    expect(screen.getByLabelText('Minutes').value).toBe('45');
    expect(screen.getByLabelText('Calories (kcal)').value).toBe('400');
    expect(screen.getByLabelText('Type of workout').value).toBe('Strength & Resistance');
  });

  test('a token the server no longer accepts signs the user out and opens the login page', async () => {
    mockFetch({ status: 401, body: { error: 'Invalid or expired token' } });
    renderScreen();
    fillValid();
    press('Save workout');

    expect(await screen.findByText('Login page')).toBeTruthy();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('a server that cannot be reached shows a message and keeps the form', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    renderScreen();
    fillValid();
    press('Save workout');

    expect((await screen.findByRole('alert')).textContent).toMatch(/cannot reach the server/i);
    expect(screen.getByLabelText('Calories (kcal)').value).toBe('400');
  });
});
