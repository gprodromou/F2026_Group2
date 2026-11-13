// WorkoutList.test.jsx: tests for the workout history screen with its summary and chart (RQ07, UC06).
// fetch is replaced by a fake server that answers GET /workouts the way Marius's route does
// (it narrows the dates, not the type). A fake login token stands in for "signed in" and the
// real AuthProvider, API client and FilterBar are used.

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WorkoutList, { formatDuration, formatDate, summarise } from '../pages/WorkoutList';
import { AuthProvider } from '../state/AuthContext';

function makeToken() {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 7, role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

const ROWS = [
  { workout_id: 1, workout_date: '2026-11-02', exercise_type: 'HIIT', duration: 30, calories_burned: 300, equipment_used: 'None (bodyweight)' },
  { workout_id: 2, workout_date: '2026-11-10', exercise_type: 'Strength & Resistance', duration: 90, calories_burned: 450, equipment_used: 'Dumbbells' },
  { workout_id: 3, workout_date: '2026-11-05', exercise_type: 'Boxing', duration: 45, calories_burned: null, equipment_used: null },
];

// A fake server: GET /workouts[?from=&to=] -> the rows inside the dates.
function fakeServer(rows = ROWS) {
  global.fetch = jest.fn(async (url) => {
    const query = new URLSearchParams(String(url).split('?')[1] || '');
    let list = rows;
    if (query.get('from')) list = list.filter((w) => w.workout_date >= query.get('from'));
    if (query.get('to')) list = list.filter((w) => w.workout_date <= query.get('to'));
    return { ok: true, status: 200, json: async () => list };
  });
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/workouts']}>
      <AuthProvider>
        <Routes>
          <Route path="/workouts" element={<WorkoutList />} />
          <Route path="/workouts/new" element={<p>Workout entry page</p>} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

const items = () => within(screen.getByRole('list', { name: 'Your workouts' })).getAllByRole('listitem');
const set = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', makeToken());
});

describe('WorkoutList', () => {
  test('a visitor who is not signed in is sent to the login page', () => {
    localStorage.clear();
    fakeServer();
    renderScreen();
    expect(screen.getByText('Login page')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('shows the user\'s workouts, newest first, with all their details', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });

    expect(screen.getByRole('heading', { name: 'Workout History' })).toBeTruthy();
    expect(screen.getByText('3 workouts')).toBeTruthy();
    const rows = items();
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Strength & Resistance');
    expect(rows[0].textContent).toContain('10 Nov 2026');
    expect(rows[0].textContent).toContain('1 h 30 min');
    expect(rows[0].textContent).toContain('450 kcal');
    expect(rows[0].textContent).toContain('Dumbbells');
    expect(rows[1].textContent).toContain('Boxing');
    expect(rows[2].textContent).toContain('HIIT');
  });

  test('the request carries the login token', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/workouts');
    expect(options.headers.Authorization).toMatch(/^Bearer /);
  });

  test('missing calories and equipment show a dash', async () => {
    fakeServer([ROWS[2]]);
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });
    expect(screen.getByText('1 workout')).toBeTruthy();
    expect(items()[0].textContent).toContain('Calories-');
    expect(items()[0].textContent).toContain('Equipment-');
  });

  test('a date range narrows the list', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });

    set('From', '2026-11-04');
    await waitFor(() => expect(items()).toHaveLength(2));
    expect(global.fetch.mock.calls.at(-1)[0]).toContain('from=2026-11-04');

    set('To', '2026-11-06');
    await waitFor(() => expect(items()).toHaveLength(1));
    expect(items()[0].textContent).toContain('Boxing');
  });

  test('the type filter narrows the list, and Clear brings everything back', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });

    set('Workout type', 'HIIT');
    await waitFor(() => expect(items()).toHaveLength(1));
    expect(items()[0].textContent).toContain('HIIT');

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(items()).toHaveLength(3));
  });

  test('the type list has the form\'s types and the custom type the user typed', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });
    const options = Array.from(screen.getByLabelText('Workout type').options).map((o) => o.value);
    expect(options).toEqual(expect.arrayContaining(['Cardiovascular', 'HIIT', 'Functional Training', 'Boxing']));
    expect(options).not.toContain('Running'); // the old default list is gone
  });

  test('a filter with no matches says so and keeps the filters', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });

    set('From', '2027-01-01');
    await screen.findByText('No workouts match these filters.');
    expect(screen.queryByRole('list', { name: 'Your workouts' })).toBeNull();
    expect(screen.getByLabelText('From')).toBeTruthy();
  });


  test('the summary and the chart add up the workouts that are shown', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });

    const summary = within(screen.getByRole('region', { name: 'Summary of the workouts shown' }));
    expect(summary.getByText('2 h 45 min')).toBeTruthy(); // 30 + 90 + 45 minutes
    expect(summary.getByText('750 kcal')).toBeTruthy(); // 300 + 450, the Boxing workout has none

    const bars = within(screen.getByRole('list', { name: 'Minutes by workout type' })).getAllByRole('listitem');
    expect(bars).toHaveLength(3);
    expect(bars[0].textContent).toContain('Strength & Resistance');
    expect(bars[0].textContent).toContain('90 min');
    expect(bars[2].textContent).toContain('HIIT');
  });

  test('the summary and the chart follow the filters', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your workouts' });

    set('Workout type', 'HIIT');
    await waitFor(() => expect(items()).toHaveLength(1));
    const summary = within(screen.getByRole('region', { name: 'Summary of the workouts shown' }));
    expect(summary.getByText('30 min', { selector: '.history-tile__value' })).toBeTruthy();
    expect(summary.getByText('300 kcal')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Minutes by workout type' })).getAllByRole('listitem')).toHaveLength(1);
  });

  test('no summary is drawn when there are no workouts', async () => {
    fakeServer([]);
    renderScreen();
    await screen.findByText('You have not logged any workouts yet.');
    expect(screen.queryByRole('region', { name: 'Summary of the workouts shown' })).toBeNull();
  });

  test('a user with no workouts is invited to log the first one', async () => {
    fakeServer([]);
    renderScreen();
    await screen.findByText('You have not logged any workouts yet.');
    fireEvent.click(screen.getByRole('link', { name: 'Log your first workout' }));
    expect(screen.getByText('Workout entry page')).toBeTruthy();
  });

  test('a server error shows its message', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: 'Database is busy' }) }));
    renderScreen();
    await screen.findByText('Database is busy');
  });

  test('an unreachable server shows the connection message', async () => {
    global.fetch = jest.fn(async () => { throw new TypeError('Failed to fetch'); });
    renderScreen();
    await screen.findByText(/cannot reach the server/i);
  });

  test('a 401 signs the user out and opens the login page', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'Invalid token' }) }));
    renderScreen();
    await screen.findByText('Login page');
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('history formatting', () => {
  test('durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(91)).toBe('1 h 31 min');
    expect(formatDuration(null)).toBe('-');
  });

  test('dates do not move with the time zone', () => {
    expect(formatDate('2026-11-01')).toBe('1 Nov 2026');
    expect(formatDate('nonsense')).toBe('nonsense');
  });
});

describe('summarise', () => {
  test('adds up time and calories and sorts the bars, longest first', () => {
    const result = summarise(ROWS);
    expect(result.count).toBe(3);
    expect(result.minutes).toBe(165);
    expect(result.calories).toBe(750);
    expect(result.bars.map((b) => b.type)).toEqual(['Strength & Resistance', 'Boxing', 'HIIT']);
    expect(result.bars[0].percent).toBe(100);
    expect(result.bars[1].percent).toBe(50);
  });

  test('workouts of the same type share one bar', () => {
    const result = summarise([ROWS[0], { ...ROWS[0], workout_id: 9, duration: 20 }]);
    expect(result.bars).toHaveLength(1);
    expect(result.bars[0].minutes).toBe(50);
  });

  test('calories stay empty when no workout has any', () => {
    expect(summarise([ROWS[2]]).calories).toBeNull();
  });
});
