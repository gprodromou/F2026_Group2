// AppShell.jsx: the frame of the signed-in app screens (Workout History, Goals).
//   header: the fit4you logo on the left, the three-line menu on the right
//           (the same header as Layout when signed in, so every page looks the same)
//   ->  the page title and the page  ->  the footer
//
//   <AppShell title="Workout History"> ...the page... </AppShell>
//
// Week 7 (Yanna): the menu is now the slide-out panel (SiteMenu.jsx: Home, Log Workout,
// History, Goals, Admin for administrators, Log out) instead of a small dropdown, and the
// title moved under the header. These screens sit outside Layout in routes.jsx, so there is
// only one header and one footer.

import { Link } from 'react-router-dom';
import SiteFooter from './SiteFooter';
import SiteMenu from './SiteMenu';
import './Layout.css'; // the header, logo and slogan styles are shared with Layout
import './AppShell.css';

export default function AppShell({ title, children }) {
  return (
    <div className="app-shell">
      <header className="layout__header">
        <div className="layout__brand">
          <Link to="/" className="layout__logo">
            fit4you
          </Link>
          <span className="layout__slogan">your fitness, your way</span>
        </div>

        <SiteMenu />
      </header>

      <main className="app-shell__main">
        <h1 className="app-shell__title">{title}</h1>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
