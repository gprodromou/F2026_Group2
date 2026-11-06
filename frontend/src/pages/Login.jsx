// Login.jsx: the login screen (RQ03, UC02).
// Sends the email and password to POST /auth/login (Marius's endpoint):
//   200 { token }   correct details -> save the token, go to the signed-in page
//   401 { error }   wrong email or password
//   401 '2FA code required'  this user has two-factor login on -> go to the code screen
//
// The detail that matters: when the login fails, the error appears next to the
// form and NOTHING the user typed is cleared. We never reset the fields.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, FormError } from '../components/ui';
import { validateForm, loginRules } from '../lib/validate';
import { useAuth } from '../state/AuthContext';
import { setPendingLogin } from '../lib/pendingLogin';
import './Auth.css';

const SIGNED_IN_PATH = '/'; // change when the signed-in page has its own route
const VERIFY_PATH = '/two-factor/verify';
const TWO_FACTOR_REQUIRED = '2FA code required'; // the message Marius's login sends

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth(); // saves the token AND tells the whole app we are signed in
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault(); // no page reload, so nothing typed is lost
    if (submitting) return;

    setFormError('');
    const found = validateForm(values, loginRules); // checks before sending
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email.trim(), password: values.password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 && data.error === TWO_FACTOR_REQUIRED) {
          // Right email and password, but a code is needed. Keep the details in memory
          // only (never in storage) so the code screen can send them again with the code.
          setPendingLogin({ email: values.email.trim(), password: values.password });
          navigate(VERIFY_PATH);
          return;
        }
        setFormError(data.error || 'We could not log you in. Try again.');
        return; // email and password stay exactly as typed
      }

      const { token } = await response.json();
      signIn(token);
      navigate(SIGNED_IN_PATH);
    } catch {
      setFormError('We cannot reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1 className="auth-title">Login</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          disabled={submitting}
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          disabled={submitting}
        />

        <FormError message={formError} id="login-error" />

        <div className="auth-actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log In'}
          </Button>
        </div>
      </form>

      <p className="auth-footer">
        Don&apos;t have an account with us?{' '}
        <Link className="auth-link" to="/register">
          Register Here
        </Link>
      </p>
    </section>
  );
}
