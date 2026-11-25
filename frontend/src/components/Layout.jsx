// Layout.jsx: the main frame (Landing, NotFound).
//   header (logo + slogan + navigation)  ->  content area  ->  footer
// <Outlet /> is the hole where React Router puts the page for the current URL.
// The navigation itself (three states: signed out, signed in, admin) is in Nav.jsx.

import { Link, Outlet } from 'react-router-dom';
import Nav from './Nav';
import SiteFooter from './SiteFooter';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">
          <Link to="/" className="layout__logo">
            fit4you
          </Link>
          <span className="layout__slogan">your fitness, your way</span>
        </div>

        <Nav />
      </header>

      <div className="layout__main">
        <Outlet />
      </div>

      <SiteFooter />
    </div>
  );
}
