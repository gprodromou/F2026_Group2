// Register.jsx: the registration screen (RQ01, UC01). Two steps, as designed:
//   Step 1 "Register":   full name, email, password, confirm password
//   Step 2 "Statistics": height, weight, birthday
// Everything is kept in one place (state). There is no Back button (Yanna, week 7): an email
// that is already registered sends the user back to step 1 automatically, with the error.
// Only when "Complete" is pressed is ONE request sent to POST /auth/register
// (Marius's endpoint expects all fields in a single call):
//   201 { userId }   account created -> log in with the same details, save the token,
//                    then go to the two-factor setup screen (UC14)
//   400 { error }    something missing
//   409 { error }    email already registered (RQ02) -> back to step 1, error at the email
// Checks before sending use lib/validate.js; the inputs and buttons come from
// Bogdan C's UI kit (components/ui).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, FormError } from '../components/ui';
import { validateForm, registerRules, required } from '../lib/validate';
import { useAuth } from '../state/AuthContext';
import DateSelect from '../components/DateSelect';
import { MONTH_NAMES, isoDate, yearRange } from '../lib/dates';
import './Auth.css';

const SETUP_PATH = '/two-factor/setup'; // new accounts set up two-factor login first

const INITIAL_VALUES = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  heightWhole: '',
  heightDecimal: '',
  heightUnit: 'cm',
  weightWhole: '',
  weightDecimal: '',
  weightUnit: 'kg',
  birthMonth: '',
  birthDay: '',
  birthYear: '',
};

// ---------- checks before sending ----------
// The one password rule (same 8 as registerRules.password in lib/validate.js).
// It is shown under the password box and ticks itself once it is met.
const PASSWORD_MIN = 8;

const STEP1_RULES = {
  name: registerRules.name,
  email: registerRules.email,
  password: registerRules.password,
  confirmPassword: (value, all) =>
    required(value, 'Confirm password') ||
    (value !== all.password ? 'The passwords do not match' : null),
};

// ---------- birthday: Day / Month / Year dropdowns, plus a calendar ----------
export const MIN_AGE = 16;   // you must be at least 16 to register
const MAX_AGE = 100;         // how far back the year list goes
export { MONTH_NAMES }; // the months, written out (lib/dates.js)

// The latest birthday allowed today (exactly MIN_AGE years ago) and the earliest one.
function birthdayLimits(today = new Date()) {
  const latest = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
  const earliest = new Date(today.getFullYear() - MAX_AGE, 0, 1);
  return { latest, earliest };
}

// Years from the newest allowed (16 years ago) back to 100 years ago.
function birthYears() {
  const { latest, earliest } = birthdayLimits();
  return yearRange(latest.getFullYear(), earliest.getFullYear());
}

// The date is real and in the past (validate.js), and the person is at least 16.
function birthdayRule(value) {
  const problem = registerRules.dateOfBirth(value);
  if (problem) return problem;
  return value > isoDate(birthdayLimits().latest)
    ? `You must be at least ${MIN_AGE} to register`
    : null;
}

const STEP2_RULES = {
  dateOfBirth: birthdayRule,
  height: registerRules.height,
  weight: registerRules.weight,
};

// "5" + "5" -> "5.5". Empty whole part -> '' (the rule then says it is required).
function combine(whole, decimal) {
  const w = String(whole).trim();
  const d = String(decimal).trim();
  if (w === '') return '';
  return d === '' ? w : `${w}.${d}`;
}

// Month, day and year boxes -> "YYYY-MM-DD". '' if all empty, 'invalid' if not a real date.
function buildDate(year, month, day) {
  const y = String(year).trim();
  const m = String(month).trim();
  const d = String(day).trim();
  if (!y && !m && !d) return '';
  if (!/^\d{4}$/.test(y) || !/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(d)) return 'invalid';
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const isReal =
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d);
  if (!isReal) return 'invalid';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Height in cm is a whole number, so its decimal box is hidden; m and ft have one.
// Weight (kg and lb) always has a decimal box. Leaving a decimal box empty is fine.
export const HEIGHT_UNITS_WITH_DECIMAL = ['m', 'ft'];
const heightHasDecimal = (unit) => HEIGHT_UNITS_WITH_DECIMAL.includes(unit);

// The values the step 2 rules look at.
function statsValues(v) {
  return {
    // a decimal typed earlier is ignored once the unit is switched to cm
    height: combine(v.heightWhole, heightHasDecimal(v.heightUnit) ? v.heightDecimal : ''),
    weight: combine(v.weightWhole, v.weightDecimal),
    dateOfBirth: buildDate(v.birthYear, v.birthMonth, v.birthDay),
  };
}

// The server stores one number per measurement: height in cm, weight in kg.
const round1 = (n) => Math.round(n * 10) / 10;
const CM_PER_UNIT = { cm: 1, m: 100, ft: 30.48 };
const toCentimetres = (value, unit) => round1(Number(value) * (CM_PER_UNIT[unit] || 1));
const toKilograms = (value, unit) => round1(unit === 'lb' ? Number(value) * 0.45359237 : Number(value));

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth(); // saves the token AND tells the whole app we are signed in
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  // The birthday comes from DateSelect as { day, month, year }.
  function handleBirthday({ day, month, year }) {
    setValues((current) => ({ ...current, birthDay: day, birthMonth: month, birthYear: year }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setFormError('');

    if (step === 1) {
      const found = validateForm(values, STEP1_RULES);
      setErrors(found);
      if (Object.keys(found).length === 0) setStep(2);
      return;
    }

    const stats = statsValues(values);
    const found = validateForm(stats, STEP2_RULES);
    setErrors(found);
    if (Object.keys(found).length > 0) return; // nothing is sent

    await createAccount(stats);
  }

  async function createAccount(stats) {
    setSubmitting(true);
    try {
      const registerResponse = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          dateOfBirth: stats.dateOfBirth,
          height: toCentimetres(stats.height, values.heightUnit),
          weight: toKilograms(stats.weight, values.weightUnit),
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json().catch(() => ({}));
        const message = data.error || 'We could not create your account. Try again.';
        if (registerResponse.status === 409) {
          setErrors({ email: message }); // the email field is on step 1
          setStep(1);
        } else {
          setFormError(message);
        }
        return; // everything typed stays
      }

      // The register endpoint returns no token, so log in with the same details.
      const loginResponse = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email.trim(), password: values.password }),
      });

      if (!loginResponse.ok) {
        navigate('/login'); // the account exists; the user only has to log in
        return;
      }

      const { token } = await loginResponse.json();
      signIn(token);
      navigate(SETUP_PATH);
    } catch {
      setFormError('We cannot reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1 className="auth-title">{step === 1 ? 'Register' : 'Statistics'}</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {step === 1 ? (
          <>
            <Input id="name" name="name" required label="Full name" autoComplete="name"
              value={values.name} onChange={handleChange} error={errors.name} />
            <Input id="email" name="email" required type="email" label="Email address" autoComplete="email"
              value={values.email} onChange={handleChange} error={errors.email} />
            <Input id="password" name="password" required type="password" label="Password" autoComplete="new-password"
              hint={`At least ${PASSWORD_MIN} characters`} hintMet={values.password.length >= PASSWORD_MIN}
              value={values.password} onChange={handleChange} error={errors.password} />
            <Input id="confirmPassword" name="confirmPassword" required type="password" label="Confirm password"
              autoComplete="new-password"
              value={values.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
          </>
        ) : (
          <>
            {/* Each box keeps its full label for screen readers and tests ("Height (whole)"),
                but the label is hidden on screen: the group title says what it is, and a dot
                between the two boxes shows that they make one number. */}
            <fieldset className="stat-group">
              <legend className="stat-group__title stat-group__title--required">Height</legend>
              {/* cm has no decimal box: the one box then sits in the middle, same size as the others */}
              <div className={`stat-row stat-row--measure${heightHasDecimal(values.heightUnit) ? '' : ' stat-row--no-decimal'}`}>
                <Input id="heightWhole" name="heightWhole" type="number" min="0" label="Height (whole)"
                  hideLabel value={values.heightWhole} onChange={handleChange} />
                {heightHasDecimal(values.heightUnit) && (
                  <>
                    <span className="stat-dot" aria-hidden="true">.</span>
                    <Input id="heightDecimal" name="heightDecimal" type="number" min="0" max="99" label="Height (decimal)" hideLabel
                      value={values.heightDecimal} onChange={handleChange} />
                  </>
                )}
                <div className="stat-unit">
                  <label className="field__label field__label--hidden" htmlFor="heightUnit">Height units</label>
                  <select id="heightUnit" name="heightUnit" className="select-pill"
                    value={values.heightUnit} onChange={handleChange}>
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              </div>
              <FormError message={errors.height} id="height-error" />
            </fieldset>

            <fieldset className="stat-group">
              <legend className="stat-group__title stat-group__title--required">Weight</legend>
              <div className="stat-row stat-row--measure">
                <Input id="weightWhole" name="weightWhole" type="number" min="0" label="Weight (whole)"
                  hideLabel value={values.weightWhole} onChange={handleChange} />
                <span className="stat-dot" aria-hidden="true">.</span>
                <Input id="weightDecimal" name="weightDecimal" type="number" min="0" max="99" label="Weight (decimal)" hideLabel
                  value={values.weightDecimal} onChange={handleChange} />
                <div className="stat-unit">
                  <label className="field__label field__label--hidden" htmlFor="weightUnit">Weight units</label>
                  <select id="weightUnit" name="weightUnit" className="select-pill"
                    value={values.weightUnit} onChange={handleChange}>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <FormError message={errors.weight} id="weight-error" />
            </fieldset>

            <fieldset className="stat-group">
              <legend className="stat-group__title stat-group__title--required">Birthday</legend>
              {/* Day, Month (written out), Year, then a calendar button. The years stop at
                  16 years ago. The month's value is still its number (3 for March), so
                  the server gets the same "YYYY-MM-DD" as before. */}
              <DateSelect
                ids={{ day: 'birthDay', month: 'birthMonth', year: 'birthYear' }}
                value={{ day: values.birthDay, month: values.birthMonth, year: values.birthYear }}
                onChange={handleBirthday}
                years={birthYears()}
                min={isoDate(birthdayLimits().earliest)}
                max={isoDate(birthdayLimits().latest)}
              />
              <FormError message={errors.dateOfBirth} id="dateOfBirth-error" />
            </fieldset>

            <FormError message={formError} id="register-error" />
          </>
        )}

        <div className="auth-actions">
          <Button type="submit" disabled={submitting}>
            {step === 1 ? 'Continue' : submitting ? 'Creating account...' : 'Complete'}
          </Button>
        </div>
      </form>

      <p className="auth-footer">
        Already have an account?{' '}
        <Link className="auth-link" to="/login">
          Log in
        </Link>
      </p>
    </section>
  );
}
