// Layout.jsx: the main frame (Landing, NotFound).
//   header (logo + slogan + navigation)  ->  content area  ->  footer
// <Outlet /> is the hole where React Router puts the page for the current URL.
// Signed out: the full navigation (Nav.jsx: Home, About, Services, Contact us, Sign up, Sign in).
// Signed in: only the three-line menu (SiteMenu.jsx), with the app links inside it.

import { Link, Outlet } from 'react-router-dom';
import Nav from './Nav';
import SiteFooter from './SiteFooter';
import SiteMenu from './SiteMenu';
import { useAuth } from '../state/AuthContext';
import './Layout.css';

export default function Layout() {
  const { isSignedIn } = useAuth();

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">
          <Link to="/" className="layout__logo">
            fit4you
          </Link>
          <span className="layout__slogan">your fitness, your way</span>
        </div>

        {isSignedIn ? <SiteMenu /> : <Nav />}
      </header>

      <div className="layout__main">
        <Outlet />
      </div>

      <SiteFooter />
    </div>
  );
}
