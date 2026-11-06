// Register.jsx: the registration screen (RQ01, UC01). Two steps, as designed:
//   Step 1 "Register":   full name, email, password, confirm password
//   Step 2 "Statistics": height, weight, birthday
// Everything is kept in one place (state), so pressing Back loses nothing.
// Only when "Complete" is pressed is ONE request sent to POST /auth/register
// (Marius's endpoint expects all fields in a single call):
//   201 { userId }   account created -> log in with the same details, save the token,
//                    then go to the two-factor setup screen (UC14)
//   400 { error }    something missing
//   409 { error }    email already registered (RQ02) -> back to step 1, error at the email
// Checks before sending use lib/validate.js; the inputs and buttons come from
// Bogdan C's UI kit (components/ui).

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, FormError } from '../components/ui';
import { validateForm, registerRules, required } from '../lib/validate';
import { useAuth } from '../state/AuthContext';
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
const STEP1_RULES = {
  name: registerRules.name,
  email: registerRules.email,
  password: registerRules.password,
  confirmPassword: (value, all) =>
    required(value, 'Confirm password') ||
    (value !== all.password ? 'The passwords do not match' : null),
};

const STEP2_RULES = {
  dateOfBirth: registerRules.dateOfBirth,
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

// The values the step 2 rules look at.
function statsValues(v) {
  return {
    height: combine(v.heightWhole, v.heightDecimal),
    weight: combine(v.weightWhole, v.weightDecimal),
    dateOfBirth: buildDate(v.birthYear, v.birthMonth, v.birthDay),
  };
}

// The server stores one number per measurement: height in cm, weight in kg.
const round1 = (n) => Math.round(n * 10) / 10;
const toCentimetres = (value, unit) => round1(unit === 'ft' ? Number(value) * 30.48 : Number(value));
const toKilograms = (value, unit) => round1(unit === 'lb' ? Number(value) * 0.45359237 : Number(value));

export default function Register() {
  const navigate = useNavigate();
  const { signIn } = useAuth(); // saves the token AND tells the whole app we are signed in
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  // Back on step 1 goes to the previous page; on step 2 it goes back to step 1.
  function handleBack() {
    if (step === 2) {
      setErrors({});
      setFormError('');
      setStep(1);
    } else if (location.key === 'default') {
      navigate('/'); // opened directly, so there is no previous page
    } else {
      navigate(-1);
    }
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
            <Input id="name" name="name" label="Full name" autoComplete="name"
              value={values.name} onChange={handleChange} error={errors.name} />
            <Input id="email" name="email" type="email" label="Email address" autoComplete="email"
              value={values.email} onChange={handleChange} error={errors.email} />
            <Input id="password" name="password" type="password" label="Password" autoComplete="new-password"
              value={values.password} onChange={handleChange} error={errors.password} />
            <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirm password"
              autoComplete="new-password"
              value={values.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
          </>
        ) : (
          <>
            <fieldset className="stat-group">
              <legend className="stat-group__title">Height</legend>
              <div className="stat-row">
                <Input id="heightWhole" name="heightWhole" type="number" min="0" label="Height (whole)"
                  value={values.heightWhole} onChange={handleChange} />
                <Input id="heightDecimal" name="heightDecimal" type="text" inputMode="numeric"
                  label="Height (decimal)" value={values.heightDecimal} onChange={handleChange} />
                <div className="stat-unit">
                  <label className="stat-unit__label" htmlFor="heightUnit">Height units</label>
                  <select id="heightUnit" name="heightUnit" className="stat-unit__select"
                    value={values.heightUnit} onChange={handleChange}>
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              </div>
              <FormError message={errors.height} id="height-error" />
            </fieldset>

            <fieldset className="stat-group">
              <legend className="stat-group__title">Weight</legend>
              <div className="stat-row">
                <Input id="weightWhole" name="weightWhole" type="number" min="0" label="Weight (whole)"
                  value={values.weightWhole} onChange={handleChange} />
                <Input id="weightDecimal" name="weightDecimal" type="text" inputMode="numeric"
                  label="Weight (decimal)" value={values.weightDecimal} onChange={handleChange} />
                <div className="stat-unit">
                  <label className="stat-unit__label" htmlFor="weightUnit">Weight units</label>
                  <select id="weightUnit" name="weightUnit" className="stat-unit__select"
                    value={values.weightUnit} onChange={handleChange}>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <FormError message={errors.weight} id="weight-error" />
            </fieldset>

            <fieldset className="stat-group">
              <legend className="stat-group__title">Birthday</legend>
              <div className="stat-row">
                <Input id="birthMonth" name="birthMonth" type="number" min="1" max="12" label="Month"
                  value={values.birthMonth} onChange={handleChange} />
                <Input id="birthDay" name="birthDay" type="number" min="1" max="31" label="Day"
                  value={values.birthDay} onChange={handleChange} />
                <Input id="birthYear" name="birthYear" type="number" label="Year"
                  value={values.birthYear} onChange={handleChange} />
              </div>
              <FormError message={errors.dateOfBirth} id="dateOfBirth-error" />
            </fieldset>

            <FormError message={formError} id="register-error" />
          </>
        )}

        <div className="auth-actions">
          <Button variant="secondary" onClick={handleBack} disabled={submitting}>
            Back
          </Button>
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
