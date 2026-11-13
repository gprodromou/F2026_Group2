// WorkoutList.jsx: the workout history screen (RQ07, UC06).
// Shows the signed-in user's workouts, newest first, with Bogdan C's FilterBar on top
// (From date, To date, workout type, Clear).
//   - The list comes from listWorkouts(api, filter) (api/workouts.js). The server narrows the
//     dates and the type is narrowed in the browser. Only the user's own workouts come back.
//   - FilterBar does not fetch: it reports the new filter and this page loads the list again.
//   - If a newer request starts before an older one finishes, the older answer is ignored,
//     so a slow answer can never overwrite the list the user is looking at.
//   - States: loading, error (the message stays, the old list stays), empty list, and
//     "nothing matches your filters" (with the filters still on screen to change).
//   - The type dropdown shows the form's types plus any custom type the user typed with "Other".
//   - A summary (number of workouts, total time, total calories) and a bar chart of the time
//     per workout type are worked out from the workouts that are shown, so they follow the filters.
//   - The page sits in AppShell: big title, three-line menu button, light footer.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import AppShell from '../components/AppShell';
import { FormError } from '../components/ui';
import { useAuth } from '../state/AuthContext';
import { useApi } from '../api/client';
import { listWorkouts } from '../api/workouts';
import { NO_FILTER, isEmptyFilter } from '../lib/workoutFilter';
import { WORKOUT_TYPE_NAMES } from '../lib/workoutTypes';
import './WorkoutList.css';

// 45 -> "45 min", 60 -> "1 h", 90 -> "1 h 30 min"
export function formatDuration(minutes) {
  const total = Number(minutes);
  if (!Number.isFinite(total) || total <= 0) return '-';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

// '2026-11-10' -> '10 Nov 2026'. Built from the text, not from Date, so the time zone
// can never move the day.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDate(text) {
  const [y, m, d] = String(text).split('-');
  if (!y || !m || !d || !MONTHS[Number(m) - 1]) return String(text);
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

// Newest date first; the newest saved one first when the date is the same.
function newestFirst(a, b) {
  if (a.workout_date !== b.workout_date) return a.workout_date < b.workout_date ? 1 : -1;
  return (b.workout_id ?? 0) - (a.workout_id ?? 0);
}

// The numbers for the summary tiles and the chart, from the workouts that are shown.
export function summarise(workouts) {
  let minutes = 0;
  let calories = 0;
  let hasCalories = false;
  const perType = new Map();
  workouts.forEach((w) => {
    const mins = Number(w.duration) || 0;
    minutes += mins;
    if (w.calories_burned != null) {
      calories += Number(w.calories_burned) || 0;
      hasCalories = true;
    }
    perType.set(w.exercise_type, (perType.get(w.exercise_type) || 0) + mins);
  });
  const bars = [...perType.entries()]
    .map(([type, mins]) => ({ type, minutes: mins }))
    .sort((a, b) => b.minutes - a.minutes || a.type.localeCompare(b.type));
  const longest = bars.length ? bars[0].minutes : 0;
  return {
    count: workouts.length,
    minutes,
    calories: hasCalories ? calories : null,
    // width is a share of the longest bar, so the longest one always fills the track
    bars: bars.map((bar) => ({ ...bar, percent: longest ? Math.max(4, Math.round((bar.minutes / longest) * 100)) : 0 })),
  };
}

export default function WorkoutList() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const latest = useRef(0); // number of the newest request

  const [workouts, setWorkouts] = useState([]);
  const [filter, setFilter] = useState(NO_FILTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customTypes, setCustomTypes] = useState([]); // types typed with "Other"

  const load = useCallback(async (next) => {
    const mine = ++latest.current;
    setFilter(next);
    setLoading(true);
    setError('');
    try {
      const rows = await listWorkouts(apiRef.current, next);
      if (mine !== latest.current) return; // a newer request is running, ignore this one
      setWorkouts([...rows].sort(newestFirst));
      // Remember custom types so the user can filter by them too.
      setCustomTypes((known) => {
        const extra = rows
          .map((w) => w.exercise_type)
          .filter((t) => t && !WORKOUT_TYPE_NAMES.includes(t) && !known.includes(t));
        return extra.length ? [...known, ...new Set(extra)].sort() : known;
      });
    } catch (e) {
      if (mine !== latest.current) return;
      if (e.status !== 401) setError(e.message); // 401: the client signs out and redirects
    } finally {
      if (mine === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) load(NO_FILTER);
  }, [isSignedIn, load]);

  if (!isSignedIn) return <Navigate to="/login" replace />;

  const filtered = !isEmptyFilter(filter);
  const summary = summarise(workouts);

  return (
    <AppShell title="Workout History">
      <div className="history-card">
        <div className="history-panel history-panel--filters">
          <FilterBar onChange={load} types={[...WORKOUT_TYPE_NAMES, ...customTypes]} />
        </div>

        <FormError message={error} />

        {loading && workouts.length === 0 && !error && (
          <p className="history-message" role="status">Loading your workouts…</p>
        )}

        {!loading && !error && workouts.length === 0 && (
          <div className="history-message history-message--empty">
            <p>{filtered ? 'No workouts match these filters.' : 'You have not logged any workouts yet.'}</p>
            {!filtered && (
              <Link className="history-button" to="/workouts/new">Log your first workout</Link>
            )}
          </div>
        )}

        {workouts.length > 0 && (
          <>
            <section className="history-panel history-summary" aria-label="Summary of the workouts shown">
              <div className="history-summary__tiles">
                <h2 className="history-panel__title">Summary</h2>
                <div className="history-tiles">
                  <div className="history-tile">
                    <span className="history-tile__label">Workouts</span>
                    <span className="history-tile__value">{summary.count}</span>
                  </div>
                  <div className="history-tile">
                    <span className="history-tile__label">Total time</span>
                    <span className="history-tile__value">{formatDuration(summary.minutes)}</span>
                  </div>
                  <div className="history-tile">
                    <span className="history-tile__label">Calories</span>
                    <span className="history-tile__value">
                      {summary.calories == null ? '-' : `${summary.calories.toLocaleString('en-US')} kcal`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="history-summary__chart">
                <h2 className="history-panel__title">Time by workout type (minutes)</h2>
                <ul className="history-bars" aria-label="Minutes by workout type">
                  {summary.bars.map((bar) => (
                    <li className="history-bar" key={bar.type}>
                      <span className="history-bar__label">{bar.type}</span>
                      <span className="history-bar__track" aria-hidden="true">
                        {/* width is the only dynamic value: the bar's share of the longest bar */}
                        <span className="history-bar__fill" style={{ width: `${bar.percent}%` }} />
                      </span>
                      <span className="history-bar__value">{bar.minutes} min</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <p className="history-count" aria-live="polite">
              {workouts.length === 1 ? '1 workout' : `${workouts.length} workouts`}
            </p>
            <ul className="history-list" aria-label="Your workouts" aria-busy={loading}>
              {workouts.map((w) => (
                <li className="history-item history-panel" key={w.workout_id ?? `${w.workout_date}-${w.exercise_type}-${w.duration}`}>
                  <div className="history-item__main">
                    <span className="history-item__type">{w.exercise_type}</span>
                    <span className="history-item__date">{formatDate(w.workout_date)}</span>
                  </div>
                  <dl className="history-item__stats">
                    <div>
                      <dt>Duration</dt>
                      <dd>{formatDuration(w.duration)}</dd>
                    </div>
                    <div>
                      <dt>Calories</dt>
                      <dd>{w.calories_burned == null ? '-' : `${w.calories_burned} kcal`}</dd>
                    </div>
                    <div>
                      <dt>Equipment</dt>
                      <dd>{w.equipment_used || '-'}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="history-actions">
          <Link className="history-button" to="/workouts/new">Log a workout</Link>
        </div>
      </div>
    </AppShell>
  );
}
