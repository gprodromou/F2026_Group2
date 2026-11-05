// TwoFactorVerify.jsx: the code screen after each login (UC02, UC14).
// Login.jsx sends the user here when the server answers "2FA code required".
// We send the email and password again (kept in lib/pendingLogin.js) together with
// the 6-digit code to POST /auth/login:
//   200 { token }   right code -> save the token, go to the signed-in page
//   401 { error }   wrong code -> show the error, keep what was typed

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Input, FormError } from '../components/ui';
import { validateForm } from '../lib/validate';
import { getPendingLogin, clearPendingLogin } from '../lib/pendingLogin';
import { saveToken } from '../lib/token';
import './Auth.css';

const SIGNED_IN_PATH = '/'; // change when the dashboard has its own route

// The check before sending: exactly six digits.
const codeRules = {
  code: (value) => (/^\d{6}$/.test(String(value).trim()) ? null : 'Enter the 6-digit code from your app'),
};

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Take the details once, when the screen opens. They are cleared after a successful login,
  // and reading them again on a later redraw would wrongly bounce the user back to login.
  const [pending] = useState(() => getPendingLogin());

  // Opened directly or after a reload: the details are gone, so start again at login.
  if (!pending) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setFormError('');
    const found = validateForm({ code }, codeRules);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pending.email, password: pending.password, code: code.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setFormError(data.error || 'We could not log you in. Try again.');
        return; // the code stays as typed
      }

      const { token } = await response.json();
      saveToken(token);
      clearPendingLogin();
      navigate(SIGNED_IN_PATH);
    } catch {
      setFormError('We cannot reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    clearPendingLogin();
    navigate('/login');
  }

  return (
    <section className="auth-card">
      <h1 className="auth-title">Two-factor login</h1>
      <p className="auth-text">Open your authenticator app and enter the current 6-digit code.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="code"
          name="code"
          label="Authentication code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={errors.code}
          disabled={submitting}
        />

        <FormError message={formError} id="verify-error" />

        <div className="auth-actions">
          <Button variant="secondary" onClick={handleBack} disabled={submitting}>
            Back
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Checking...' : 'Verify'}
          </Button>
        </div>
      </form>
    </section>
  );
}
