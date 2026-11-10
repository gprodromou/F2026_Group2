// FilterBar.test.jsx: tests for the workout filter bar (RQ07).
//   - it reports the chosen date range and workout type, and clears back to no filter (the plan's test)
//   - an impossible range (From after To) shows an error and is not reported
//   - the helpers in lib/workoutFilter.js turn a filter into a query and narrow a list
//   - wired to listWorkouts and the API client, a chosen filter asks GET /workouts for
//     that date range and shows only that type

import { useEffect, useState } from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import { NO_FILTER, filterToQuery, applyFilter, isEmptyFilter } from '../lib/workoutFilter';
import { listWorkouts } from '../api/workouts';
import { useApi } from '../api/client';

const setField = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const clearButton = () => screen.getByRole('button', { name: 'Clear filters' });

describe('FilterBar', () => {
  test('starts with no filter, and Clear is disabled', () => {
    render(<FilterBar onChange={jest.fn()} />);

    expect(screen.getByLabelText('From').value).toBe('');
    expect(screen.getByLabelText('To').value).toBe('');
    expect(screen.getByLabelText('Workout type').value).toBe('');
    expect(clearButton()).toBeDisabled();
  });

  test('reports the chosen date range and workout type', () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} />);

    setField('From', '2026-11-01');
    setField('To', '2026-11-30');
    setField('Workout type', 'Running');

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-11-01', to: '2026-11-30', type: 'Running' });
  });

  test('Clear empties every filter and reports no filter', () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} />);
    setField('From', '2026-11-01');
    setField('Workout type', 'Cycling');

    fireEvent.click(clearButton());

    expect(onChange).toHaveBeenLastCalledWith(NO_FILTER);
    expect(screen.getByLabelText('From').value).toBe('');
    expect(screen.getByLabelText('Workout type').value).toBe('');
    expect(clearButton()).toBeDisabled();
  });

  test('a start date after the end date shows an error and is not reported', () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} />);
    setField('To', '2026-11-10');
    onChange.mockClear();

    setField('From', '2026-11-20');

    expect(screen.getByRole('alert').textContent).toBe('The start date must be on or before the end date');
    expect(onChange).not.toHaveBeenCalled();

    // Fixing the date removes the error and reports again.
    setField('From', '2026-11-10');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-11-10', to: '2026-11-10', type: '' });
  });

  test('offers "All types" plus the types it is given', () => {
    render(<FilterBar onChange={jest.fn()} types={['Running', 'Rowing']} />);

    const options = within(screen.getByLabelText('Workout type')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['All types', 'Running', 'Rowing']);
  });
});

const ROWS = [
  { workout_id: 3, workout_date: '2026-11-20', exercise_type: 'Running', duration: 30 },
  { workout_id: 2, workout_date: '2026-11-05', exercise_type: 'cycling', duration: 60 },
  { workout_id: 1, workout_date: '2026-10-12', exercise_type: 'Running', duration: 25 },
];

describe('workoutFilter helpers', () => {
  test('filterToQuery sends only the dates that are chosen', () => {
    expect(filterToQuery(NO_FILTER)).toBe('');
    expect(filterToQuery({ from: '2026-11-01', to: '', type: 'Running' })).toBe('?from=2026-11-01');
    expect(filterToQuery({ from: '2026-11-01', to: '2026-11-30', type: '' })).toBe(
      '?from=2026-11-01&to=2026-11-30'
    );
  });

  test('applyFilter keeps the rows inside the range, edges included, and of the type', () => {
    expect(applyFilter(ROWS, NO_FILTER)).toBe(ROWS);
    const ids = (filter) => applyFilter(ROWS, filter).map((w) => w.workout_id);
    expect(ids({ from: '2026-11-05', to: '2026-11-20', type: '' })).toEqual([3, 2]);
    expect(ids({ from: '2026-11-06', to: '', type: '' })).toEqual([3]);
    expect(ids({ from: '', to: '', type: 'Running' })).toEqual([3, 1]);
    expect(ids({ from: '', to: '', type: 'Cycling' })).toEqual([2]); // capital letters do not matter
    expect(ids({ from: '2026-12-01', to: '', type: '' })).toEqual([]);
  });

  test('isEmptyFilter is true only when nothing is chosen', () => {
    expect(isEmptyFilter(NO_FILTER)).toBe(true);
    expect(isEmptyFilter({ from: '', to: '', type: 'Yoga' })).toBe(false);
  });
});

// The same wiring the workout history screen uses: FilterBar reports a filter,
// the page calls listWorkouts through the API client and shows the rows.
function HistoryWithFilters() {
  const api = useApi();
  const [rows, setRows] = useState([]);
  const load = (filter) => listWorkouts(api, filter).then(setRows);
  useEffect(() => {
    load(NO_FILTER);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <FilterBar onChange={load} />
      <ul>
        {rows.map((w) => (
          <li key={w.workout_id}>{`${w.workout_date} ${w.exercise_type}`}</li>
        ))}
      </ul>
    </>
  );
}

describe('FilterBar wired to the workout list', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'abc.def.ghi');
  });

  test('the chosen filter asks for that date range with the token, and shows only that type', async () => {
    // The server answers the date filter itself; the fake returns what it would return.
    const november = ROWS.filter((w) => w.workout_date >= '2026-11-01');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ROWS }) // first load
      .mockResolvedValue({ ok: true, status: 200, json: async () => november });

    render(
      <MemoryRouter>
        <HistoryWithFilters />
      </MemoryRouter>
    );
    expect(await screen.findAllByRole('listitem')).toHaveLength(3);

    setField('From', '2026-11-01');
    setField('Workout type', 'Running');

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
    expect(screen.getByText('2026-11-20 Running')).toBeTruthy();

    const [url, options] = global.fetch.mock.calls.at(-1);
    expect(url).toBe('/workouts?from=2026-11-01');
    expect(options.headers.Authorization).toBe('Bearer abc.def.ghi');
  });
});
