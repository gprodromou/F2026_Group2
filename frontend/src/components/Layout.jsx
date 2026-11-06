// Layout.jsx: the main frame (Landing, NotFound).
//   header (logo + navigation)  ->  content area  ->  footer
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
        <Link to="/" className="layout__logo">
          fit4you
        </Link>

        <Nav />
      </header>

      <div className="layout__main">
        <Outlet />
      </div>

      <SiteFooter />
    </div>
  );
}
