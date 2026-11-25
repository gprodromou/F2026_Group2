// WorkoutNew.jsx: the workout entry screen (RQ06, UC05, NFR06).
// ONE screen, not a wizard (NFR06: logging a workout takes few steps).
//   left:  Date, Duration and Calories, stacked, the same size
//   right: Type of Workout and Equipment Used, sharing the height equally
//
// Week 7 (Yanna):
//   - Every value is a dropdown: the date is DateSelect (Day / Month / Year + calendar, the
//     same as Register's birthday), hours / minutes / seconds and calories are lists too.
//   - Type and equipment: you can choose more than one. After choosing, a small "+" adds
//     another dropdown to the right (they wrap to the next line when the row is full), and
//     every extra one has an "x" to remove it. The database keeps ONE text per workout, so
//     several are saved joined: "HIIT, Strength & Resistance". "Other" opens an input bar.
//   - The emojis are now petrol line icons (components/WorkoutIcons.jsx).
//
// Unchanged: the checks before sending use lib/validate.js (NFR04); the workout is sent
// through Bogdan C's API client (api/client.js), which attaches the login token, and the
// user id is NEVER sent; while sending, the button is disabled; if it fails, the message
// shows and everything chosen stays.
//
// Not on this screen yet: the design's "Name" and "Notes" boxes. The workouts table has no
// columns for them (db/workouts.js saves date, type, duration, calories and equipment).

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, FormError } from '../components/ui';
import DateSelect from '../components/DateSelect';
import { TypeIcon, EquipmentIcon } from '../components/WorkoutIcons';
import { validateForm, required, positiveNumber, nonNegativeNumber, pastDate } from '../lib/validate';
import { isoDate, isoToParts, partsToIso, yearRange } from '../lib/dates';
import { useAuth } from '../state/AuthContext';
import { useApi } from '../api/client';
import { OTHER, TYPE_OPTIONS } from '../lib/workoutTypes';
import './WorkoutNew.css';

const HISTORY_PATH = '/workouts'; // where the user lands after saving (the history screen)
const YEARS_BACK = 5;             // how far back the Year dropdown goes

const TYPES = TYPE_OPTIONS.map((t) => t.value);

// The basic equipment, not too many and not too few. "None" covers bodyweight workouts.
const EQUIPMENT = [
  'None (bodyweight)',
  'Dumbbells',
  'Barbell',
  'Kettlebell',
  'Resistance bands',
  'Bench',
  'Pull-up bar',
  'Medicine ball',
  'Jump rope',
  'Yoga mat',
  'Treadmill',
  'Stationary bike',
  'Rowing machine',
  'Elliptical',
  'Stair climber',
  'Cable machine',
  'Smith machine',
  'Leg press machine',
  'Lat pulldown machine',
  'Chest press machine',
  OTHER,
];

// What the duration and calories dropdowns offer.
const range = (from, to, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
const HOURS = range(0, 12);
const MINUTES = range(0, 59);
const SECONDS = range(0, 59);
const CALORIES = range(0, 3000, 25);

const INITIAL_VALUES = () => {
  const { day, month, year } = isoToParts(isoDate(new Date())); // today
  return {
    dateDay: day,
    dateMonth: month,
    dateYear: year,
    hours: '',
    minutes: '',
    seconds: '',
    calories: '',
    types: [''],      // one dropdown to start with; "+" adds more
    otherType: '',
    equipment: [''],
    otherEquipment: '',
  };
};

const dateOf = (v) => partsToIso({ day: v.dateDay, month: v.dateMonth, year: v.dateYear });

// Hours, minutes and seconds -> total seconds. An empty dropdown counts as 0.
function totalSeconds(v) {
  return Number(v.hours || 0) * 3600 + Number(v.minutes || 0) * 60 + Number(v.seconds || 0);
}

// ---------- checks before sending ----------
function durationError(all) {
  for (const part of [all.hours, all.minutes, all.seconds]) {
    if (String(part).trim() !== '' && nonNegativeNumber(part, 'Duration')) {
      return 'Duration must use numbers that are 0 or more';
    }
  }
  return positiveNumber(totalSeconds(all), 'Duration') ? 'Duration must be greater than 0' : null;
}

const RULES = {
  date: (_, all) => pastDate(dateOf(all), 'Date'),
  duration: (_, all) => durationError(all),
  calories: (v) => nonNegativeNumber(v, 'Calories'),
  types: (v) => (v.some(Boolean) ? null : 'Choose a workout type'),
  otherType: (v, all) => (all.types.includes(OTHER) ? required(v, 'Your workout type') : null),
  equipment: (v) => (v.some(Boolean) ? null : 'Choose the equipment you used'),
  otherEquipment: (v, all) => (all.equipment.includes(OTHER) ? required(v, 'Your equipment') : null),
};

// Several choices -> one text, with "Other" replaced by what the user typed.
function joinChoices(choices, otherText) {
  return choices
    .filter(Boolean)
    .map((c) => (c === OTHER ? otherText.trim() : c))
    .join(', ');
}

// The JSON Marius's workout route receives (the names db/workouts.js uses). The duration goes
// as whole minutes, rounded up, because the duration column is an integer. There is no user id.
function buildPayload(v) {
  return {
    workoutDate: dateOf(v),
    exerciseType: joinChoices(v.types, v.otherType),
    duration: Math.ceil(totalSeconds(v) / 60),
    caloriesBurned: Number(v.calories),
    equipmentUsed: joinChoices(v.equipment, v.otherEquipment),
  };
}

// One small dropdown with a hidden label (the panel title says what it is).
function NumberSelect({ id, label, value, onChange, options, placeholder, format = (n) => n, disabled, hideLabel }) {
  return (
    <div className="workout-select">
      <label htmlFor={id} className={`field__label${hideLabel ? ' field__label--hidden' : ''}`}>{label}</label>
      <select id={id} name={id} className="select-pill" value={value} onChange={onChange} disabled={disabled}>
        <option value="" disabled>{placeholder}</option>
        {options.map((n) => (
          <option key={n} value={String(n)}>{format(n)}</option>
        ))}
      </select>
    </div>
  );
}

// Type / equipment: a row of small dropdowns, each as wide as its text, with "+" after the
// last one (once something is chosen) and "x" on every extra one. A choice already made in
// one dropdown cannot be picked again in another.
function ChoiceRow({ name, label, noun, placeholder, choices, options, onChange, onAdd, onRemove, error, disabled }) {
  const last = choices[choices.length - 1];
  const canAdd = Boolean(last) && choices.length < options.length;

  return (
    <div className="choice-row">
      {choices.map((choice, i) => {
        const id = i === 0 ? name : `${name}-${i + 1}`;
        return (
          <span className="choice" key={id}>
            <label htmlFor={id} className="field__label field__label--hidden">
              {i === 0 ? label : `${label} ${i + 1}`}
            </label>
            <select
              id={id}
              className={`select-pill select-pill--fit${i === 0 && error ? ' field__input--error' : ''}`}
              value={choice}
              onChange={(e) => onChange(i, e.target.value)}
              disabled={disabled}
              aria-invalid={i === 0 && error ? 'true' : undefined}
              aria-describedby={i === 0 && error ? `${name}-error` : undefined}
            >
              <option value="">{placeholder}</option>
              {options.map((o) => (
                <option key={o} value={o} disabled={o !== choice && choices.includes(o)}>{o}</option>
              ))}
            </select>
            {i > 0 && (
              <button type="button" className="choice__remove" onClick={() => onRemove(i)}
                aria-label={`Remove ${noun} ${i + 1}`} disabled={disabled}>
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>
              </button>
            )}
          </span>
        );
      })}
      {canAdd && (
        <button type="button" className="choice__add" onClick={onAdd}
          aria-label={`Add another ${noun}`} disabled={disabled}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
        </button>
      )}
    </div>
  );
}

export default function WorkoutNew() {
  const navigate = useNavigate();
  const api = useApi(); // attaches the token; a 401 signs the user out and opens the login page
  const { isSignedIn } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only signed-in users can log workouts.
  if (!isSignedIn) return <Navigate to="/login" replace />;

  const thisYear = new Date().getFullYear();

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleDate({ day, month, year }) {
    setValues((current) => ({ ...current, dateDay: day, dateMonth: month, dateYear: year }));
  }

  // The same three actions for both rows: choose, add one, remove one.
  const listActions = (key) => ({
    onChange: (index, value) =>
      setValues((c) => ({ ...c, [key]: c[key].map((x, i) => (i === index ? value : x)) })),
    onAdd: () => setValues((c) => ({ ...c, [key]: [...c[key], ''] })),
    onRemove: (index) => setValues((c) => ({ ...c, [key]: c[key].filter((_, i) => i !== index) })),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');
    const found = validateForm(values, RULES);
    setErrors(found);
    if (Object.keys(found).length > 0) return; // nothing is sent

    setSubmitting(true);
    try {
      await api.post('/workouts', buildPayload(values));
      navigate(HISTORY_PATH);
    } catch (error) {
      // The client already turned the answer into a readable message (and handled a 401).
      if (error.status !== 401) setFormError(error.message); // everything chosen stays
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="workout-page">
      <h1 className="workout-page__title">Workout Log</h1>

      <form className="workout-card" onSubmit={handleSubmit} noValidate>
        <div className="workout-grid">
          {/* ---------- left: Date, Duration, Calories ---------- */}
          <div className="workout-column workout-column--left">
            <fieldset className="workout-panel">
              <legend className="workout-panel__title">Date</legend>
              <DateSelect
                ids={{ day: 'dateDay', month: 'dateMonth', year: 'dateYear' }}
                value={{ day: values.dateDay, month: values.dateMonth, year: values.dateYear }}
                onChange={handleDate}
                years={yearRange(thisYear, thisYear - YEARS_BACK)}
                min={`${thisYear - YEARS_BACK}-01-01`}
                max={isoDate(new Date())}
                disabled={submitting}
              />
              <FormError message={errors.date} id="date-error" />
            </fieldset>

            <fieldset className="workout-panel">
              <legend className="workout-panel__title">Duration</legend>
              <div className="workout-inline">
                <NumberSelect id="hours" label="Hours" placeholder="0" options={HOURS}
                  value={values.hours} onChange={handleChange} disabled={submitting} />
                <NumberSelect id="minutes" label="Minutes" placeholder="0" options={MINUTES}
                  value={values.minutes} onChange={handleChange} disabled={submitting} />
                <NumberSelect id="seconds" label="Seconds" placeholder="0" options={SECONDS}
                  value={values.seconds} onChange={handleChange} disabled={submitting} />
              </div>
              <FormError message={errors.duration} id="duration-error" />
            </fieldset>

            <fieldset className="workout-panel">
              <legend className="workout-panel__title">Calories</legend>
              <NumberSelect id="calories" label="Calories (kcal)" hideLabel placeholder="Choose kcal"
                options={CALORIES} format={(n) => `${n} kcal`}
                value={values.calories} onChange={handleChange} disabled={submitting} />
              <FormError message={errors.calories} id="calories-error" />
            </fieldset>
          </div>

          {/* ---------- right: Type of Workout, Equipment Used ---------- */}
          <div className="workout-column workout-column--right">
            <fieldset className="workout-panel">
              <legend className="workout-panel__title">Type of Workout</legend>
              <div className="workout-choice">
                <span className="workout-choice__icon"><TypeIcon type={values.types.find(Boolean)} /></span>
                <div className="workout-choice__fields">
                  <ChoiceRow name="type" label="Type of workout" noun="type" placeholder="Choose a type" choices={values.types}
                    options={TYPES} error={errors.types} disabled={submitting} {...listActions('types')} />
                  {values.types.includes(OTHER) && (
                    <OtherInput id="otherType" label="Your workout type" placeholder="e.g., Boxing"
                      value={values.otherType} onChange={handleChange} error={errors.otherType} disabled={submitting} />
                  )}
                  <FormError message={errors.types} id="type-error" />
                </div>
              </div>
            </fieldset>

            <fieldset className="workout-panel">
              <legend className="workout-panel__title">Equipment Used</legend>
              <div className="workout-choice">
                <span className="workout-choice__icon">
                  <EquipmentIcon equipment={values.equipment.find(Boolean)} />
                </span>
                <div className="workout-choice__fields">
                  <ChoiceRow name="equipment" label="Equipment used" noun="equipment" placeholder="Choose equipment" choices={values.equipment}
                    options={EQUIPMENT} error={errors.equipment} disabled={submitting} {...listActions('equipment')} />
                  {values.equipment.includes(OTHER) && (
                    <OtherInput id="otherEquipment" label="Your equipment" placeholder="e.g., Battle ropes"
                      value={values.otherEquipment} onChange={handleChange} error={errors.otherEquipment}
                      disabled={submitting} />
                  )}
                  <FormError message={errors.equipment} id="equipment-error" />
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        <FormError message={formError} id="workout-error" />

        <div className="workout-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save workout'}
          </Button>
        </div>
      </form>
    </section>
  );
}

// The input bar that opens under the dropdowns when "Other" is chosen (label hidden: the
// placeholder and the panel title say what it is).
function OtherInput({ id, label, placeholder, value, onChange, error, disabled }) {
  return (
    <div className="workout-other">
      <label htmlFor={id} className="field__label field__label--hidden">{label}</label>
      <input id={id} name={id} className={`field__input${error ? ' field__input--error' : ''}`}
        placeholder={placeholder} value={value} onChange={onChange} disabled={disabled}
        aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-error` : undefined} />
      <FormError message={error} id={`${id}-error`} />
    </div>
  );
}
