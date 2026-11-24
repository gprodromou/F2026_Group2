// Goals.test.jsx: tests for the goals screen (RQ11, RQ13, UC07).
// fetch is replaced by a fake server that answers GET /goals and GET /goals/:id/progress
// the way Marius's routes do. A fake login token stands in for "signed in", and the real
// AuthProvider, API client, GoalCard and ProgressBar are used.

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Goals, { sortGoals } from '../pages/Goals';
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
  global.fetch = jest.fn(async (url) => {
    const match = /\/goals\/(\d+)\/progress$/.exec(String(url));
    if (match) {
      const id = Number(match[1]);
      if (failProgressFor.includes(id)) return reply(500, { error: 'Something went wrong' });
      return reply(200, PROGRESS[id]);
    }
    if (listStatus !== 200) return reply(listStatus, { error: 'Could not load goals' });
    return reply(200, goals);
  });
}

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

  test('shows one card per goal with its progress bar, active first and completed/expired after', async () => {
    fakeServer();
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    expect(screen.getByRole('heading', { name: 'My Goals' })).toBeTruthy();
    const list = cards();
    expect(list).toHaveLength(3);
    // active calories goal first, then the completed duration goal, then the expired one
    expect(list[0].textContent).toContain('3200');
    expect(list[1].textContent).toContain('Completed');
    expect(list[2].textContent).toContain('Expired');

    const bars = screen.getAllByRole('progressbar');
    expect(bars.map((bar) => bar.getAttribute('aria-valuenow'))).toEqual(['64', '100', '40']);
  });

  test('a user with no goals sees a message instead of an empty page', async () => {
    fakeServer({ goals: [] });
    renderScreen();
    expect(await screen.findByText('You have not set any goals yet.')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Your goals' })).toBeNull();
  });

  test('if the goal list cannot be loaded, the server message is shown', async () => {
    fakeServer({ listStatus: 500 });
    renderScreen();
    expect(await screen.findByText('Could not load goals')).toBeTruthy();
    expect(screen.queryByText('You have not set any goals yet.')).toBeNull();
  });

  test('if one progress request fails, the other cards still show their bars', async () => {
    fakeServer({ failProgressFor: [2] });
    renderScreen();
    await screen.findByRole('list', { name: 'Your goals' });

    expect(cards()).toHaveLength(3);
    expect(screen.getByText('Progress is not available right now.')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
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
