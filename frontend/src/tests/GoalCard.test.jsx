// GoalCard.test.jsx: tests for the progress bar and the goal card (RQ11, RQ13, UC07).
//   - ProgressBar fills to the right width at 0, 50 and 100 per cent (the plan's test),
//     and keeps a wrong value inside 0..100
//   - GoalCard shows the goal's type, target, date, status and bar, and an expired state
//     (the plan's test)
//   - listGoalsWithProgress gets each goal and its progress from the real endpoints
//     through the API client, the way the goals screen will

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProgressBar, { clampPercent } from '../components/ProgressBar';
import GoalCard, { formatTargetDate } from '../components/GoalCard';
import { listGoalsWithProgress } from '../api/goals';
import { apiRequest } from '../api/client';
import { GOAL_TYPE_OPTIONS } from '../lib/goalTypes';

const fillOf = (bar) => bar.firstChild.style.width;

describe('ProgressBar', () => {
  test.each([
    [0, '0%'],
    [50, '50%'],
    [100, '100%'],
  ])('at %p per cent the fill is %s wide and the screen reader hears it', (percent, width) => {
    render(<ProgressBar percent={percent} label="Burn calories progress" />);
    const bar = screen.getByRole('progressbar', { name: 'Burn calories progress' });
    expect(fillOf(bar)).toBe(width);
    expect(bar.getAttribute('aria-valuenow')).toBe(String(percent));
    expect(screen.getByText(width)).toBeTruthy();
  });

  test('a value outside 0..100, or no value, stays inside the bar', () => {
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(undefined)).toBe(0);
    expect(clampPercent('abc')).toBe(0);
    expect(clampPercent(33.6)).toBe(34);
  });

  test('the status changes the look of the bar', () => {
    const { container } = render(<ProgressBar percent={40} status="expired" />);
    expect(container.firstChild.className).toContain('progress--expired');
  });
});

const goal = {
  goal_id: 1,
  user_id: 1,
  goal_type: 'calories',
  target_value: 2000,
  target_date: '2026-12-31',
  status: 'active',
};

describe('GoalCard', () => {
  test('shows the type, the progress against the target, the date and the bar', () => {
    render(
      <GoalCard goal={goal} progress={{ current: 1000, target: 2000, percent: 50, status: 'active' }} />
    );
    expect(screen.getByRole('heading', { name: 'Burn calories' })).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText(/of 2000 kcal/).textContent).toBe('1000 of 2000 kcal');
    expect(screen.getByText('31 Dec 2026')).toBeTruthy();
    expect(fillOf(screen.getByRole('progressbar'))).toBe('50%');
  });

  test('an expired goal says so, and its bar is greyed out', () => {
    const expired = { ...goal, goal_type: 'workouts', target_value: 10, target_date: '2026-11-01', status: 'expired' };
    const { container } = render(
      <GoalCard goal={expired} progress={{ current: 4, target: 10, percent: 40, status: 'expired' }} />
    );
    expect(screen.getByText('Expired')).toBeTruthy();
    expect(screen.getByText(/Target date passed/)).toBeTruthy();
    expect(container.querySelector('.goal-card--expired')).not.toBeNull();
    expect(container.querySelector('.progress--expired')).not.toBeNull();
  });

  test('a completed goal shows a full bar', () => {
    render(
      <GoalCard
        goal={{ ...goal, goal_type: 'duration', target_value: 300, status: 'completed' }}
        progress={{ current: 320, target: 300, percent: 100, status: 'completed' }}
      />
    );
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(fillOf(screen.getByRole('progressbar'))).toBe('100%');
  });

  test('while progress is loading, or if it failed, the card still shows the goal', () => {
    const { rerender } = render(<GoalCard goal={goal} />);
    expect(screen.getByText('Loading progress...')).toBeTruthy();
    expect(screen.getByText('Target: 2000 kcal')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();

    rerender(<GoalCard goal={goal} progress={null} />);
    expect(screen.getByText('Progress is not available right now.')).toBeTruthy();
  });

  test('the page can put its own buttons at the bottom of the card', () => {
    render(
      <GoalCard goal={goal}>
        <button type="button">Delete</button>
      </GoalCard>
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  test('dates are shown in the same day in every time zone, and goal types match the server', () => {
    expect(formatTargetDate('2026-01-01')).toBe('1 Jan 2026');
    expect(GOAL_TYPE_OPTIONS.map((o) => o.value)).toEqual(['calories', 'duration', 'workouts']);
  });
});

describe('listGoalsWithProgress (api/goals.js)', () => {
  afterEach(() => {
    delete global.fetch;
    localStorage.clear();
  });

  // A tiny stand-in for useApi(): the same get() the pages use, without a router.
  const api = { get: (path) => apiRequest(path) };

  const reply = (status, body) => Promise.resolve({ ok: status < 400, status, json: async () => body });

  test('asks GET /goals, then GET /goals/:id/progress for each goal, with the token', async () => {
    localStorage.setItem('token', 'abc.def.ghi');
    global.fetch = jest.fn((url) => {
      if (url === '/goals') return reply(200, [goal, { ...goal, goal_id: 2 }]);
      if (url === '/goals/1/progress') return reply(200, { goalId: 1, current: 500, target: 2000, percent: 25, status: 'active' });
      return reply(404, { error: 'Goal not found' });
    });

    const goals = await listGoalsWithProgress(api);

    expect(global.fetch.mock.calls.map(([url]) => url).sort()).toEqual([
      '/goals',
      '/goals/1/progress',
      '/goals/2/progress',
    ]);
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc.def.ghi');
    expect(goals[0].progress.percent).toBe(25);
    expect(goals[1].progress).toBeNull(); // one failed request does not break the list
  });

  test('the cards render straight from what it returns', async () => {
    global.fetch = jest.fn((url) =>
      url === '/goals'
        ? reply(200, [goal])
        : reply(200, { goalId: 1, current: 1500, target: 2000, percent: 75, status: 'active' })
    );
    const goals = await listGoalsWithProgress(api);

    render(
      <MemoryRouter>
        <ul>
          {goals.map((g) => (
            <li key={g.goal_id}>
              <GoalCard goal={g} progress={g.progress} />
            </li>
          ))}
        </ul>
      </MemoryRouter>
    );
    const card = screen.getByRole('listitem');
    expect(fillOf(within(card).getByRole('progressbar'))).toBe('75%');
  });
});
