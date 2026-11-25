// Goals.test.jsx: tests for the goals screen (RQ11, RQ13, UC07).
// fetch is replaced by a fake server that answers GET /goals and GET /goals/:id/progress
// the way Marius's routes do, plus POST /goals, PUT /goals/:id and DELETE /goals/:id
// (week 7: the endpoint names still to be confirmed with the backend team).
// A fake login token stands in for "signed in", and the real AuthProvider, API client and
// ProgressBar are used.

import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Goals, { sortGoals, goalName, formatTarget } from '../pages/Goals';
import { AuthProvider } from '../state/AuthContext';

function makeToken() {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = { user_id: 7, role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.fake-signature`;
}

const GOALS = [
  { goal_id: 1, goal_type: 'workouts', target_value: 10, target_date: '2026-10-01', status: 'expired' },
  { goal_id: 2, goal_type: 'calories', target_value: 5000, target_date: '2026-12-31', status: 'active' },
  { goal_id: 3, goal_type: 'duration', target_value: 600, target_date: '2026-12-15', status: 'active' },
];

const PROGRESS = {
  1: { goalId: 1, goalType: 'workouts', current: 4, target: 10, percent: 40, status: 'expired' },
  2: { goalId: 2, goalType: 'calories', current: 3200, target: 5000, percent: 64, status: 'active' },
  3: { goalId: 3, goalType: 'duration', current: 600, target: 600, percent: 100, status: 'completed' },
};

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body });

// A fake server. failProgressFor: goal ids whose progress request answers 500.
function fakeServer({ goals = GOALS, listStatus = 200, failProgressFor = [] } = {}) {
  let rows = [...goals];
  global.fetch = jest.fn(async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const path = String(url);
    const match = /\/goals\/(\d+)\/progress$/.exec(path);
    if (match) {
      const id = Number(match[1]);
      if (failProgressFor.includes(id)) return reply(500, { error: 'Something went wrong' });
      return reply(200, PROGRESS[id] || { current: 0, target: 1, percent: 0, status: 'active' });
    }
    const one = /\/goals\/(\d+)$/.exec(path);
    if (one && method === 'DELETE') {
      rows = rows.filter((g) => g.goal_id !== Number(one[1]));
      return reply(204, {});
    }
    if (one && method === 'PUT') {
      const body = JSON.parse(options.body);
      rows = rows.map((g) => (g.goal_id === Number(one[1])
        ? { ...g, target_value: body.targetValue, target_date: body.targetDate } : g));
      return reply(200, {});
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      rows = [...rows, { goal_id: 99, goal_type: body.goalType, target_value: body.targetValue, target_date: body.targetDate, status: 'active' }];
      return reply(201, { goalId: 99 });
    }
    if (listStatus !== 200) return reply(listStatus, { error: 'Could not load goals' });
    return reply(200, rows);
  });
}

const calls = (method) =>
  global.fetch.mock.calls.filter(([, o = {}]) => (o.method || 'GET').toUpperCase() === method);

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/goals']}>
      <AuthProvider>
        <Routes>
          <Route path="/goals" element={<Goals />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

const cards = () => within(screen.getByRole('list', { name: 'Your goals' })).getAllByRole('listitem');

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('token', makeToken());
});

describe('Goals screen', () => {
  test('a visitor who is not signed in is sent to the login page', () => {
    localStorage.clear();
    fakeServer();
    renderScreen();
    expect(screen.getByText('Login page')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('shows one row per goal, active first, the first one open with its progress bar', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    expect(screen.getByRole('heading', { name: 'Goals' })).toBeTruthy();
    const list = cards();
    expect(list).toHaveLength(3);
    // active calories goal first, then the completed duration goal, then the expired one
    expect(list[0].textContent).toContain('Burn 5,000 kcal');
    expect(list[1].textContent).toContain('Completed');
    expect(list[2].textContent).toContain('Expired');

    // only the first one is open, so only its bar shows
    const toggles = screen.getAllByRole('button', { expanded: true });
    expect(toggles).toHaveLength(1);
    expect(toggles[0].textContent).toContain('Burn 5,000 kcal');
    expect(screen.getAllByRole('progressbar').map((b) => b.getAttribute('aria-valuenow'))).toEqual(['64']);
    expect(screen.getByText(/Progress: 64%/)).toBeTruthy();
  });

  test('opening another goal closes the open one', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    fireEvent.click(screen.getByRole('button', { name: /Train for 10 h/ }));

    expect(screen.getByRole('button', { name: /Train for 10 h/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Burn 5,000 kcal/ }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.getAllByRole('progressbar').map((b) => b.getAttribute('aria-valuenow'))).toEqual(['100']);
  });

  test('a user with no goals sees a message instead of an empty page', async () => {
    fakeServer({ goals: [] });
    renderScreen();
    expect(await screen.findByText(/You have not set any goals yet/)).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Your goals' })).toBeNull();
  });

  test('if the goal list cannot be loaded, the server message is shown', async () => {
    fakeServer({ listStatus: 500 });
    renderScreen();
    expect(await screen.findByText('Could not load goals')).toBeTruthy();
    expect(screen.queryByText(/You have not set any goals yet/)).toBeNull();
  });

  test('if one progress request fails, that goal says so and the others still work', async () => {
    fakeServer({ failProgressFor: [2] });
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    expect(cards()).toHaveLength(3);
    expect(screen.getByText('Progress is not available right now.')).toBeTruthy(); // goal 2 is open
    fireEvent.click(screen.getByRole('button', { name: /Train for 10 h/ }));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('New Goal', () => {
  const form = () => screen.getByRole('form', { name: 'New Goal' });
  const inForm = (label) => within(form()).getByLabelText(label);
  const choose = (label, value) => fireEvent.change(inForm(label), { target: { value } });
  const nextYear = new Date().getFullYear() + 1;

  test('an empty form shows messages and sends nothing', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    fireEvent.click(within(form()).getByRole('button', { name: 'Add goal' }));

    expect(screen.getByText('Choose a type of goal')).toBeTruthy();
    expect(screen.getByText('Choose a target date')).toBeTruthy();
    expect(calls('POST')).toHaveLength(0);
  });

  test('the target value follows the type: hours + minutes, kcal or a number', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    choose('Type of goal', 'duration');
    expect(inForm('Hours')).toBeTruthy();
    expect(inForm('Minutes')).toBeTruthy();

    choose('Type of goal', 'calories');
    expect(within(form()).queryByLabelText('Hours')).toBeNull();
    expect(inForm('Target value (kcal)')).toBeTruthy();

    choose('Type of goal', 'workouts');
    expect(inForm('Target value (workouts)')).toBeTruthy();
  });

  test('a past target date is refused', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    choose('Type of goal', 'workouts');
    choose('Target value (workouts)', '12');
    fireEvent.change(within(form()).getByLabelText('Choose from a calendar'), { target: { value: '2020-01-01' } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Add goal' }));

    expect(screen.getByText('Target date cannot be in the past')).toBeTruthy();
    expect(calls('POST')).toHaveLength(0);
  });

  test('a valid goal is sent (duration in minutes) and appears in the list', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    choose('Type of goal', 'duration');
    choose('Hours', '2');
    choose('Minutes', '30');
    fireEvent.change(within(form()).getByLabelText('Choose from a calendar'), { target: { value: `${nextYear}-06-15` } });
    fireEvent.click(within(form()).getByRole('button', { name: 'Add goal' }));

    await waitFor(() => expect(cards()).toHaveLength(4));
    const [url, options] = calls('POST')[0];
    expect(url).toBe('/goals');
    expect(JSON.parse(options.body)).toEqual({ goalType: 'duration', targetValue: 150, targetDate: `${nextYear}-06-15` });
    expect(screen.getByText('Train for 2 h 30 min')).toBeTruthy();
  });
});

describe('Update and Delete', () => {
  test('Update changes the target value in place and sends it', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    fireEvent.click(screen.getByRole('button', { name: /Update/ })); // goal 2 (calories) is open
    fireEvent.change(screen.getByLabelText('Target value (kcal)'), { target: { value: '6000' } });
    // a date in next year, so this test keeps working after the sample date has passed
    const nextYear = new Date().getFullYear() + 1;
    fireEvent.change(within(cards()[0]).getByLabelText('Choose from a calendar'), { target: { value: `${nextYear}-01-31` } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(calls('PUT')).toHaveLength(1));
    const [url, options] = calls('PUT')[0];
    expect(url).toBe('/goals/2');
    expect(JSON.parse(options.body)).toEqual({ targetValue: 6000, targetDate: `${nextYear}-01-31` });
    expect(await screen.findByText('Burn 6,000 kcal')).toBeTruthy();
  });

  test('Delete asks first, then removes the goal', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    expect(screen.getByText('Delete this goal?')).toBeTruthy();
    expect(calls('DELETE')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(calls('DELETE')[0][0]).toBe('/goals/2');
    expect(screen.queryByText('Burn 5,000 kcal')).toBeNull();
  });
});

describe('goal names', () => {
  test('are made from the goal, since the database has no name', () => {
    expect(goalName({ goal_type: 'calories', target_value: 3000 })).toBe('Burn 3,000 kcal');
    expect(goalName({ goal_type: 'duration', target_value: 125 })).toBe('Train for 2 h 5 min');
    expect(goalName({ goal_type: 'workouts', target_value: 1 })).toBe('Do 1 workout');
    expect(formatTarget('workouts', 12)).toBe('12 workouts');
  });
});

describe('sortGoals', () => {
  test('active goals come first, nearest target date first inside each group', () => {
    const sorted = sortGoals([
      { goal_id: 'a', status: 'expired', target_date: '2026-01-01' },
      { goal_id: 'b', status: 'active', target_date: '2026-12-31' },
      { goal_id: 'c', status: 'completed', target_date: '2026-11-01' },
      { goal_id: 'd', status: 'active', target_date: '2026-12-01' },
    ]);
    expect(sorted.map((g) => g.goal_id)).toEqual(['d', 'b', 'c', 'a']);
  });

  test('the status from the progress answer wins over the status in the list', () => {
    const sorted = sortGoals([
      { goal_id: 'a', status: 'active', target_date: '2026-12-01', progress: { status: 'completed' } },
      { goal_id: 'b', status: 'active', target_date: '2026-12-31' },
    ]);
    expect(sorted.map((g) => g.goal_id)).toEqual(['b', 'a']);
  });
});
