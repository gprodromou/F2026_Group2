// TwoFactorSetup.jsx: the screen after signing up that turns on two-factor login (UC14).
// 1. On opening, it asks the server for a secret: POST /auth/2fa/setup (needs the token)
//    -> { secret, otpauthUrl }. otpauthUrl is the text a phone app understands,
//    so we draw it as a QR code (qrcode.react). The secret is shown too, to type by hand.
// 2. The user scans it and types the first 6-digit code from the app.
// 3. We check it with POST /auth/2fa/enable { code } -> 200 turns 2FA on, 400 wrong code.
//    A right first code proves the scan worked, so the user cannot lock themselves out.
// Both requests go through the API client (api/client.js, Bogdan C, week 4), which attaches
// the token and, if the server answers 401, signs the user out and opens the login page.

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Input, FormError } from '../components/ui';
import { validateForm } from '../lib/validate';
import { getToken } from '../lib/token';
import { useApi } from '../api/client';
import './Auth.css';

const SIGNED_IN_PATH = '/'; // change when the dashboard has its own route

const codeRules = {
  code: (value) => (/^\d{6}$/.test(String(value).trim()) ? null : 'Enter the 6-digit code from your app'),
};

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const api = useApi();
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

    api
      .post('/auth/2fa/setup')
      .then((data) => setSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl }))
      .catch((error) => {
        if (error.status === 401) return; // the client has already sent the user to the login page
        setLoadError(error.message);
      });
  }, [token, api]);

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
      await api.post('/auth/2fa/enable', { code: code.trim() });
      navigate(SIGNED_IN_PATH);
    } catch (error) {
      if (error.status !== 401) setFormError(error.message); // the code stays as typed
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
