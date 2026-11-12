// WorkoutNew.jsx: the workout entry screen (RQ06, UC05, NFR06).
// ONE screen, not a wizard (NFR06: logging a workout takes few steps).
// The user fills in: date, duration, calories, type and equipment.
//   - Type and equipment are lists. "Other" opens an input bar for the user's own text.
//   - The checks before sending use lib/validate.js (NFR04).
//   - The workout is sent through Bogdan C's API client (api/client.js), which attaches the
//     login token. The user id is NEVER sent: the server takes it from the token.
//   - While it is sending the button is disabled; if it fails, the message shows and
//     everything typed stays where it was.
//
// Not on this screen yet: the design's "Name" and "Notes" boxes. The workouts table has no
// columns for them (db/workouts.js saves date, type, duration, calories and equipment), so
// anything typed there would be lost. They come back when the backend can store them.

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Input, FormError } from '../components/ui';
import { validateForm, required, positiveNumber, nonNegativeNumber, pastDate } from '../lib/validate';
import { useAuth } from '../state/AuthContext';
import { useApi } from '../api/client';
import { OTHER, TYPE_OPTIONS } from '../lib/workoutTypes';
import './WorkoutNew.css';

const HISTORY_PATH = '/workouts'; // where the user lands after saving (the history screen)

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

// Today as YYYY-MM-DD in the user's own time zone (the default date of a new workout).
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const INITIAL_VALUES = () => ({
  date: today(),
  hours: '',
  minutes: '',
  seconds: '',
  calories: '',
  type: '',
  otherType: '',
  equipment: '',
  otherEquipment: '',
});

// Hours, minutes and seconds -> total seconds. An empty box counts as 0.
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
  date: (v) => pastDate(v, 'Date'),
  duration: (_, all) => durationError(all),
  calories: (v) => nonNegativeNumber(v, 'Calories'),
  type: (v) => (v ? null : 'Choose a workout type'),
  otherType: (v, all) => (all.type === OTHER ? required(v, 'Your workout type') : null),
  equipment: (v) => (v ? null : 'Choose the equipment you used'),
  otherEquipment: (v, all) => (all.equipment === OTHER ? required(v, 'Your equipment') : null),
};

// The JSON Marius's workout route receives (the names db/workouts.js uses). The duration goes
// as whole minutes, rounded up, because the duration column is an integer. There is no user id.
function buildPayload(v) {
  return {
    workoutDate: v.date,
    exerciseType: v.type === OTHER ? v.otherType.trim() : v.type,
    duration: Math.ceil(totalSeconds(v) / 60),
    caloriesBurned: Number(v.calories),
    equipmentUsed: v.equipment === OTHER ? v.otherEquipment.trim() : v.equipment,
  };
}

// A label + dropdown, styled like the UI kit's Input (same classes as components/ui/Input).
function SelectField({ id, label, value, onChange, error, disabled, placeholder, children }) {
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      <select
        id={id}
        name={id}
        className={`field__input${error ? ' field__input--error' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <div className="field__error">
        <FormError message={error} id={errorId} />
      </div>
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

  const typeIcon = TYPE_OPTIONS.find((t) => t.value === values.type)?.icon || '💪';

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

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
      if (error.status !== 401) setFormError(error.message); // everything typed stays
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="workout-page">
      <h1 className="workout-page__title">Workout Log</h1>

      <form className="workout-card" onSubmit={handleSubmit} noValidate>
        <h2 className="workout-card__title">Stats</h2>

        <div className="workout-grid">
          <div className="workout-column">
            <div className="workout-panel">
              <Input id="date" name="date" type="date" label="Date"
                value={values.date} onChange={handleChange} error={errors.date} disabled={submitting} />
            </div>

            <div className="workout-row">
              <fieldset className="workout-panel">
                <legend className="workout-panel__title">Duration</legend>
                <div className="workout-inline">
                  <Input id="hours" name="hours" type="number" min="0" label="Hours"
                    value={values.hours} onChange={handleChange} disabled={submitting} />
                  <Input id="minutes" name="minutes" type="number" min="0" label="Minutes"
                    value={values.minutes} onChange={handleChange} disabled={submitting} />
                  <Input id="seconds" name="seconds" type="number" min="0" label="Seconds"
                    value={values.seconds} onChange={handleChange} disabled={submitting} />
                </div>
                <FormError message={errors.duration} id="duration-error" />
              </fieldset>

              <div className="workout-panel">
                <h3 className="workout-panel__title">Calories</h3>
                <Input id="calories" name="calories" type="number" min="0" label="Calories (kcal)"
                  value={values.calories} onChange={handleChange} error={errors.calories} disabled={submitting} />
              </div>
            </div>
          </div>

          <div className="workout-column">
            <div className="workout-panel">
              <h3 className="workout-panel__title">Type of Workout</h3>
              <div className="workout-choice">
                <span className="workout-choice__icon" aria-hidden="true">{typeIcon}</span>
                <div className="workout-choice__fields">
                  <SelectField id="type" label="Type of workout" placeholder="Choose a type"
                    value={values.type} onChange={handleChange} error={errors.type} disabled={submitting}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.value}</option>
                    ))}
                  </SelectField>
                  {values.type === OTHER && (
                    <Input id="otherType" name="otherType" label="Your workout type"
                      placeholder="e.g., Boxing" value={values.otherType} onChange={handleChange}
                      error={errors.otherType} disabled={submitting} />
                  )}
                </div>
              </div>
            </div>

            <div className="workout-panel">
              <h3 className="workout-panel__title">Equipment Used</h3>
              <div className="workout-choice">
                <span className="workout-choice__icon" aria-hidden="true">🏋️</span>
                <div className="workout-choice__fields">
                  <SelectField id="equipment" label="Equipment used" placeholder="Choose equipment"
                    value={values.equipment} onChange={handleChange} error={errors.equipment} disabled={submitting}>
                    {EQUIPMENT.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </SelectField>
                  {values.equipment === OTHER && (
                    <Input id="otherEquipment" name="otherEquipment" label="Your equipment"
                      placeholder="e.g., Battle ropes" value={values.otherEquipment} onChange={handleChange}
                      error={errors.otherEquipment} disabled={submitting} />
                  )}
                </div>
              </div>
            </div>
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
