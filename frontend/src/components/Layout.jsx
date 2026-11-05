// Layout.jsx: the main frame (Landing, NotFound).
//   header (logo + navigation)  ->  content area  ->  footer
// <Outlet /> is the hole where React Router puts the page for the current URL.

import { Link, NavLink, Outlet } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__logo">
          fit4you
        </Link>

        <nav className="layout__nav" aria-label="Main navigation">
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          <NavLink to="/register" className="nav-button nav-button--secondary">
            Sign up
          </NavLink>
          <NavLink to="/login" className="nav-button nav-button--primary">
            Sign in
          </NavLink>
        </nav>
      </header>

      <div className="layout__main">
        <Outlet />
      </div>

      <SiteFooter />
    </div>
  );
}
