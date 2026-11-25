// Login.jsx: the login screen (RQ03, UC02).
// The form itself (fields, checks, POST /auth/login, two-factor hand-off) lives in
// components/LoginForm.jsx, because the Landing page shows the same form in its login card.
// This page only adds the pink card, the "Login" title and the link to Register.

import { Link } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import './Auth.css';

export default function Login() {
  return (
    <section className="auth-card">
      <h1 className="auth-title">Login</h1>

      <LoginForm />

      <p className="auth-footer">
        Don&apos;t have an account with us?{' '}
        <Link className="auth-link" to="/register">
          Register Here
        </Link>
      </p>
    </section>
  );
}
