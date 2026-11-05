// AuthLayout.jsx: the frame for Login and Register (matches the Login design).
//   centred logo  ->  the form card  ->  footer. No navigation bar.

import { Link, Outlet } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <Link to="/" className="auth-layout__logo">
        fit4you
      </Link>

      <div className="auth-layout__main">
        <Outlet />
      </div>

      <SiteFooter />
    </div>
  );
}
