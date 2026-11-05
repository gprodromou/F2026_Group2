// TwoFactorSetup.jsx: the screen after signing up that turns on two-factor login (UC14).
// 1. On opening, it asks the server for a secret: POST /auth/2fa/setup (needs the token)
//    -> { secret, otpauthUrl }. otpauthUrl is the text a phone app understands,
//    so we draw it as a QR code (qrcode.react). The secret is shown too, to type by hand.
// 2. The user scans it and types the first 6-digit code from the app.
// 3. We check it with POST /auth/2fa/enable { code } -> 200 turns 2FA on, 400 wrong code.
//    A right first code proves the scan worked, so the user cannot lock themselves out.

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Input, FormError } from '../components/ui';
import { validateForm } from '../lib/validate';
import { getToken, clearToken } from '../lib/token';
import './Auth.css';

const SIGNED_IN_PATH = '/'; // change when the dashboard has its own route

const codeRules = {
  code: (value) => (/^\d{6}$/.test(String(value).trim()) ? null : 'Enter the 6-digit code from your app'),
};

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const token = getToken();
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl }
  const [loadError, setLoadError] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false); // makes sure the secret is requested only once

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    fetch('/auth/2fa/setup', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          clearToken(); // the token is no longer valid
          navigate('/login');
          return;
        }
        if (!response.ok) {
          setLoadError(data.error || 'We could not start the two-factor setup. Try again.');
          return;
        }
        setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl });
      })
      .catch(() => setLoadError('We cannot reach the server. Check your connection and try again.'));
  }, [token, navigate]);

  // Not logged in: there is no token to ask for a secret with.
  if (!token) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting || !setup) return;

    setFormError('');
    const found = validateForm({ code }, codeRules);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setFormError(data.error || 'We could not turn on two-factor login. Try again.');
        return; // the code stays as typed
      }

      navigate(SIGNED_IN_PATH);
    } catch {
      setFormError('We cannot reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card">
      <h1 className="auth-title">Set up two-factor login</h1>

      <FormError message={loadError} id="setup-error" />

      {!setup && !loadError && <p className="auth-text">Preparing your QR code...</p>}

      {setup && (
        <>
          <p className="auth-text">
            1. Scan this QR code with an authenticator app, such as Google Authenticator.
          </p>
          <div className="qr-box">
            <QRCodeSVG value={setup.otpauthUrl} size={176} title="QR code for two-factor login" />
          </div>
          <p className="auth-text">Cannot scan it? Type this key into the app:</p>
          <p className="secret-key">{setup.secret}</p>
          <p className="auth-text">2. Enter the 6-digit code the app shows to finish.</p>
        </>
      )}

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
          disabled={submitting || !setup}
        />

        <FormError message={formError} id="enable-error" />

        <div className="auth-actions">
          <Button type="submit" disabled={submitting || !setup}>
            {submitting ? 'Checking...' : 'Turn on'}
          </Button>
        </div>
      </form>
    </section>
  );
}
