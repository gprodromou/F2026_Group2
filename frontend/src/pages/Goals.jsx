// Goals.jsx: the goals screen (RQ11, RQ13, UC07). Bogdan C built the first version in
// week 6 (list, progress, sorting); Yanna rebuilt it to her design in week 7:
//
//   left  "New Goal":      Type of Goal (icon + dropdown), Target Value, Target Date, Add goal
//   right "Current Goals": one row per goal that opens and closes. Open, it shows the type,
//                          target value, target date, status, "Progress: 40%" with Bogdan C's
//                          ProgressBar, and two buttons: Update (change the target value and
//                          date in place) and Delete (asks once more first).
//
//   - Goal types are the three the backend tracks (lib/goalTypes.js): calories, duration
//     (minutes), workouts. Target Value changes with the type: hours + minutes for duration,
//     kcal for calories, a number for workouts.
//   - Goals have no name in the database, so the name is made from the goal:
//     "Burn 3,000 kcal", "Train for 2 h", "Do 12 workouts".
//   - There is no Complete button: the server marks a goal completed itself when the target
//     is reached (and expired when the date passes first).
//   - Saving, changing and deleting go through api/goals.js (createGoal, updateGoal,
//     deleteGoal). ⚠ Their endpoint names are still to be confirmed with the backend team.
//   - Order: active goals first, then completed, then expired; nearest target date first.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import ProgressBar from '../components/ProgressBar';
import DateSelect from '../components/DateSelect';
import { formatTargetDate } from '../components/GoalCard';
import { GoalIcon } from '../components/WorkoutIcons';
import { Button, FormError } from '../components/ui';
import { useAuth } from '../state/AuthContext';
import { useApi } from '../api/client';
import { listGoalsWithProgress, createGoal, updateGoal, deleteGoal } from '../api/goals';
import { GOAL_TYPE_OPTIONS, goalTypeInfo } from '../lib/goalTypes';
import { isoDate, isoToParts, partsToIso, yearRange } from '../lib/dates';
import './Goals.css';

// ---------- order ----------
const STATUS_ORDER = { active: 0, completed: 1, expired: 2 };
const STATUS_TEXT = { active: 'Active', completed: 'Completed', expired: 'Expired' };

// The status to sort by: the progress answer is newer than the list, so it wins.
function statusOf(goal) {
  return (goal.progress && goal.progress.status) || goal.status || 'active';
}

// Active first, then completed, then expired; nearest target date first in each group.
export function sortGoals(goals) {
  return [...goals].sort((a, b) => {
    const byStatus = (STATUS_ORDER[statusOf(a)] ?? 3) - (STATUS_ORDER[statusOf(b)] ?? 3);
    if (byStatus !== 0) return byStatus;
    return String(a.target_date || '').localeCompare(String(b.target_date || ''));
  });
}

// ---------- words for a goal ----------
// 125 -> "2 h 5 min", 60 -> "1 h", 45 -> "45 min"
function formatMinutes(total) {
  const n = Math.round(Number(total) || 0);
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const number = (n) => Number(n || 0).toLocaleString('en-US'); // 3000 -> "3,000"

export function formatTarget(type, value) {
  if (type === 'duration') return formatMinutes(value);
  if (type === 'calories') return `${number(value)} kcal`;
  if (type === 'workouts') return `${number(value)} ${Number(value) === 1 ? 'workout' : 'workouts'}`;
  return String(value ?? '');
}

// The automatic name: there is no name column in the database.
export function goalName(goal) {
  const value = goal.target_value;
  if (goal.goal_type === 'calories') return `Burn ${number(value)} kcal`;
  if (goal.goal_type === 'duration') return `Train for ${formatMinutes(value)}`;
  if (goal.goal_type === 'workouts') return `Do ${formatTarget('workouts', value)}`;
  return goalTypeInfo(goal.goal_type).label;
}

// ---------- the target value: depends on the goal type ----------
const range = (from, to, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
const TARGET_OPTIONS = {
  hours: range(0, 100),
  minutes: range(0, 55, 5),
  calories: range(100, 20000, 100),
  workouts: range(1, 100),
};
const EMPTY_TARGET = { hours: '', minutes: '', amount: '' };

// The boxes -> one number (minutes, kcal or workouts). 0 means nothing chosen.
function targetNumber(type, t) {
  if (type === 'duration') return Number(t.hours || 0) * 60 + Number(t.minutes || 0);
  return Number(t.amount || 0);
}

// One number -> the boxes (used when Update opens).
function targetBoxes(type, value) {
  const n = Number(value) || 0;
  if (type === 'duration') return { hours: String(Math.floor(n / 60)), minutes: String(n % 60), amount: '' };
  return { ...EMPTY_TARGET, amount: String(n) };
}

function PillSelect({ id, label, hideLabel, value, onChange, options, placeholder, format = (n) => n, disabled }) {
  return (
    <div className="goal-select">
      <label htmlFor={id} className={`field__label${hideLabel ? ' field__label--hidden' : ''}`}>{label}</label>
      <select id={id} className="select-pill" value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>{placeholder}</option>
        {options.map((n) => (
          <option key={n} value={String(n)}>{format(n)}</option>
        ))}
      </select>
    </div>
  );
}

function TargetInput({ idPrefix, type, value, onChange, disabled }) {
  const set = (part) => (next) => onChange({ ...value, [part]: next });

  if (type === 'duration') {
    // the minutes list counts in 5s, but an older goal may have e.g. 7: keep it choosable
    const minutes = TARGET_OPTIONS.minutes.includes(Number(value.minutes)) || value.minutes === ''
      ? TARGET_OPTIONS.minutes
      : [...TARGET_OPTIONS.minutes, Number(value.minutes)].sort((a, b) => a - b);
    return (
      <div className="goal-target goal-target--duration">
        <PillSelect id={`${idPrefix}-hours`} label="Hours" placeholder="0" options={TARGET_OPTIONS.hours}
          format={(n) => `${n} h`} value={value.hours} onChange={set('hours')} disabled={disabled} />
        <PillSelect id={`${idPrefix}-minutes`} label="Minutes" placeholder="0" options={minutes}
          format={(n) => `${n} min`} value={value.minutes} onChange={set('minutes')} disabled={disabled} />
      </div>
    );
  }

  if (type === 'calories' || type === 'workouts') {
    const isCalories = type === 'calories';
    let options = TARGET_OPTIONS[type];
    if (value.amount !== '' && !options.includes(Number(value.amount))) {
      options = [...options, Number(value.amount)].sort((a, b) => a - b); // an older odd value
    }
    return (
      <div className="goal-target">
        <PillSelect id={`${idPrefix}-amount`} hideLabel
          label={isCalories ? 'Target value (kcal)' : 'Target value (workouts)'}
          placeholder={isCalories ? 'Choose kcal' : 'Choose a number'} options={options}
          format={(n) => formatTarget(type, n)} value={value.amount} onChange={set('amount')} disabled={disabled} />
      </div>
    );
  }

  return <p className="goal-hint">Choose a type of goal first.</p>;
}

// ---------- the target date: today up to two years ahead ----------
const YEARS_AHEAD = 2;
function dateLimits() {
  const today = new Date();
  const latest = new Date(today.getFullYear() + YEARS_AHEAD, 11, 31);
  return { today: isoDate(today), latest: isoDate(latest), years: yearRange(latest.getFullYear(), today.getFullYear()) };
}

function dateError(parts) {
  const iso = partsToIso(parts);
  if (iso === '') return 'Choose a target date';
  if (iso === 'invalid') return 'Target date is not a valid date';
  if (iso < dateLimits().today) return 'Target date cannot be in the past';
  return null;
}

function TargetDate({ idPrefix, value, onChange, disabled }) {
  const { today, latest, years } = dateLimits();
  return (
    <DateSelect
      ids={{ day: `${idPrefix}-day`, month: `${idPrefix}-month`, year: `${idPrefix}-year` }}
      value={value}
      onChange={onChange}
      years={years}
      min={today}
      max={latest}
      disabled={disabled}
    />
  );
}

// ---------- left: New Goal ----------
const EMPTY_DATE = { day: '', month: '', year: '' };

function NewGoal({ onCreated }) {
  const api = useApi();
  const [type, setType] = useState('');
  const [target, setTarget] = useState(EMPTY_TARGET);
  const [date, setDate] = useState(EMPTY_DATE);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function chooseType(next) {
    setType(next);
    setTarget(EMPTY_TARGET); // a duration in hours makes no sense as kcal
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const found = {};
    if (!type) found.type = 'Choose a type of goal';
    if (type && targetNumber(type, target) <= 0) found.target = 'Choose a target value';
    const badDate = dateError(date);
    if (badDate) found.date = badDate;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return; // nothing is sent

    setSaving(true);
    try {
      await createGoal(api, { goalType: type, targetValue: targetNumber(type, target), targetDate: partsToIso(date) });
      setType('');
      setTarget(EMPTY_TARGET);
      setDate(EMPTY_DATE);
      onCreated();
    } catch (e) {
      if (e.status !== 401) setFormError(e.message); // everything chosen stays
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="goals-card goals-card--new" onSubmit={handleSubmit} noValidate aria-labelledby="new-goal-title">
      <h2 id="new-goal-title" className="goals-card__title">New Goal</h2>

      <fieldset className="goals-panel">
        <legend className="goals-panel__title">Type of Goal</legend>
        <div className="goal-type">
          <span className="goal-type__icon"><GoalIcon type={type} /></span>
          <PillSelect id="new-type" label="Type of goal" hideLabel placeholder="Choose a type"
            options={GOAL_TYPE_OPTIONS.map((o) => o.value)} format={(v) => goalTypeInfo(v).label}
            value={type} onChange={chooseType} disabled={saving} />
        </div>
        <FormError message={errors.type} id="new-type-error" />
      </fieldset>

      <fieldset className="goals-panel">
        <legend className="goals-panel__title">Target Value</legend>
        <TargetInput idPrefix="new" type={type} value={target} onChange={setTarget} disabled={saving} />
        <FormError message={errors.target} id="new-target-error" />
      </fieldset>

      <fieldset className="goals-panel">
        <legend className="goals-panel__title">Target Date</legend>
        <TargetDate idPrefix="new" value={date} onChange={setDate} disabled={saving} />
        <FormError message={errors.date} id="new-date-error" />
      </fieldset>

      <FormError message={formError} id="new-goal-error" />

      <div className="goals-actions">
        <Button type="submit" disabled={saving}>
          <span className="goals-add">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
            {saving ? 'Adding...' : 'Add goal'}
          </span>
        </Button>
      </div>
    </form>
  );
}

// ---------- right: one goal that opens and closes ----------
function GoalItem({ goal, open, onToggle, onChanged, onDeleted }) {
  const api = useApi();
  const bodyId = useId();
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'delete'
  const [target, setTarget] = useState(() => targetBoxes(goal.goal_type, goal.target_value));
  const [date, setDate] = useState(() => isoToParts(goal.target_date));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const status = statusOf(goal);
  const name = goalName(goal);
  const progress = goal.progress;

  function startEdit() {
    setTarget(targetBoxes(goal.goal_type, goal.target_value));
    setDate(isoToParts(goal.target_date));
    setErrors({});
    setError('');
    setMode('edit');
  }

  async function save() {
    const found = {};
    if (targetNumber(goal.goal_type, target) <= 0) found.target = 'Choose a target value';
    const badDate = dateError(date);
    if (badDate) found.date = badDate;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setError('');
    try {
      await updateGoal(api, goal.goal_id, { targetValue: targetNumber(goal.goal_type, target), targetDate: partsToIso(date) });
      setMode('view');
      onChanged();
    } catch (e) {
      if (e.status !== 401) setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await deleteGoal(api, goal.goal_id);
      onDeleted(goal.goal_id);
    } catch (e) {
      if (e.status !== 401) setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className={`goal-item goal-item--${status}${open ? ' goal-item--open' : ''}`}>
      <h3 className="goal-item__heading">
        <button type="button" className="goal-item__toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          <span className="goal-item__name">{name}</span>
          <span className={`goal-badge goal-badge--${status}`}>{STATUS_TEXT[status] || status}</span>
          <svg className="goal-item__chevron" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </h3>

      <div id={bodyId} className="goal-item__body" hidden={!open}>
        {mode === 'edit' ? (
          <div className="goal-edit">
            <p className="goal-edit__label">Target value</p>
            <TargetInput idPrefix={`edit-${goal.goal_id}`} type={goal.goal_type} value={target} onChange={setTarget} disabled={busy} />
            <FormError message={errors.target} id={`edit-${goal.goal_id}-target-error`} />
            <p className="goal-edit__label">Target date</p>
            <TargetDate idPrefix={`edit-${goal.goal_id}`} value={date} onChange={setDate} disabled={busy} />
            <FormError message={errors.date} id={`edit-${goal.goal_id}-date-error`} />
          </div>
        ) : (
          <dl className="goal-details">
            <div><dt>Target value</dt><dd>{formatTarget(goal.goal_type, goal.target_value)}</dd></div>
            <div>
              <dt>{status === 'expired' ? 'Target date (passed)' : 'Target date'}</dt>
              <dd><time dateTime={goal.target_date}>{formatTargetDate(goal.target_date)}</time></dd>
            </div>
          </dl>
        )}

        {mode !== 'edit' && (
          <div className="goal-progress">
            {progress ? (
              <>
                <p className="goal-progress__label">
                  Progress: {Math.min(100, Math.max(0, Math.round(Number(progress.percent) || 0)))}%
                  <span className="goal-progress__numbers">
                    {' '}({formatTarget(goal.goal_type, progress.current)} of {formatTarget(goal.goal_type, progress.target)})
                  </span>
                </p>
                <ProgressBar percent={progress.percent} status={status} label={`${name} progress`} />
              </>
            ) : (
              <p className="goal-progress__label">
                {progress === null ? 'Progress is not available right now.' : 'Loading progress...'}
              </p>
            )}
          </div>
        )}

        <FormError message={error} id={`goal-${goal.goal_id}-error`} />

        <div className="goal-buttons">
          {mode === 'view' && (
            <>
              <button type="button" className="goal-button" onClick={startEdit}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13 6.5A5 5 0 0 0 4 4.2L3 5.5M3 2.5v3h3M3 9.5a5 5 0 0 0 9 2.3l1-1.3M13 13.5v-3h-3" /></svg>
                Update
              </button>
              <button type="button" className="goal-button goal-button--danger" onClick={() => setMode('delete')}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                Delete
              </button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <button type="button" className="goal-button goal-button--primary" onClick={save} disabled={busy}>
                {busy ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="goal-button" onClick={() => setMode('view')} disabled={busy}>Cancel</button>
            </>
          )}
          {mode === 'delete' && (
            <>
              <span className="goal-buttons__question">Delete this goal?</span>
              <button type="button" className="goal-button goal-button--danger-solid" onClick={remove} disabled={busy}>
                {busy ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button type="button" className="goal-button" onClick={() => setMode('view')} disabled={busy}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- the page ----------
export default function Goals() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const mounted = useRef(true);

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null); // the goal that is open (one at a time)

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = sortGoals(await listGoalsWithProgress(apiRef.current));
      if (!mounted.current) return;
      setGoals(list);
      // keep the open goal open; otherwise open the first one
      setOpenId((current) => (list.some((g) => g.goal_id === current) ? current : list[0]?.goal_id ?? null));
    } catch (e) {
      if (mounted.current && e.status !== 401) setError(e.message); // 401: the client signs out
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (isSignedIn) load();
    return () => {
      mounted.current = false;
    };
  }, [isSignedIn, load]);

  if (!isSignedIn) return <Navigate to="/login" replace />;

  function handleDeleted(id) {
    setGoals((list) => list.filter((g) => g.goal_id !== id));
  }

  return (
    <AppShell title="Goals">
      <div className="goals-page">
        <NewGoal onCreated={load} />

        <section className="goals-card goals-card--current" aria-labelledby="current-goals-title">
          <h2 id="current-goals-title" className="goals-card__title">Current Goals</h2>

          <div className="goals-box">
            <FormError message={error} />

            {loading && goals.length === 0 && (
              <p className="goals-message" role="status">Loading your goals…</p>
            )}

            {!loading && !error && goals.length === 0 && (
              <p className="goals-message">You have not set any goals yet. Add your first one on the left.</p>
            )}

            {goals.length > 0 && (
              <ul className="goals-list" aria-label="Your goals">
                {goals.map((goal) => (
                  <li key={goal.goal_id}>
                    <GoalItem
                      goal={goal}
                      open={openId === goal.goal_id}
                      onToggle={() => setOpenId((current) => (current === goal.goal_id ? null : goal.goal_id))}
                      onChanged={load}
                      onDeleted={handleDeleted}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
