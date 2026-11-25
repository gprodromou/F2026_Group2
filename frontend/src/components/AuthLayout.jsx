// AuthLayout.jsx: the frame for Login, Register and the two-factor screens.
//   header: logo on the left (same look as the main header), three-line menu on the right
//   ->  the form card in the middle  ->  footer
// The menu (SiteMenu.jsx) slides in from the right with Home, About, Services,
// Contact us and Log in, so there is always a way back to the home page.

import { Link, Outlet } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import SiteMenu from './SiteMenu';
import './Layout.css'; // the logo, slogan and underline styles are shared with Layout
import './AuthLayout.css';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <header className="auth-layout__header">
        <div className="layout__brand">
          <Link to="/" className="layout__logo">
            fit4you
          </Link>
          <span className="layout__slogan">your fitness, your way</span>
        </div>

        <SiteMenu />
      </header>

      <div className="auth-layout__main">
        <Outlet />
      </div>

      <SiteFooter />
    </div>
  );
}
