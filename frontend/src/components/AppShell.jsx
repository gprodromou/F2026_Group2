// AppShell.jsx: the frame of the signed-in app screens (history now, the workout log later).
// It copies the design: a big centred title, a three-line menu button on the right,
// the page content, and the light footer.
//
//   <AppShell title="Workout History"> ...the page... </AppShell>
//
// The three-line button opens the menu: the signed-in links from Nav.jsx (Home, Log workout,
// History, and Admin for administrators) and Log out. The menu closes when a link is chosen,
// when Escape is pressed (focus returns to the button) and when the user clicks outside it.

import { useEffect, useId, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import SiteFooter from './SiteFooter';
import { SIGNED_IN_LINKS, ADMIN_LINKS } from './Nav';
import { useAuth } from '../state/AuthContext';
import './AppShell.css';

function AppMenu() {
  const { user, isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const button = useRef(null);
  const menuId = useId();

  const isAdmin = isSignedIn && String(user.role).toLowerCase() === 'admin';
  const links = isAdmin ? [...SIGNED_IN_LINKS, ...ADMIN_LINKS] : SIGNED_IN_LINKS;

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onClickOutside(event) {
      if (wrapper.current && !wrapper.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <div className="app-menu" ref={wrapper}>
      <button
        ref={button}
        type="button"
        className="app-menu__button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="app-menu__bar" />
        <span className="app-menu__bar" />
        <span className="app-menu__bar" />
      </button>

      {open && (
        <nav id={menuId} className="app-menu__panel" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="app-menu__link"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <LogoutButton />
        </nav>
      )}
    </div>
  );
}

export default function AppShell({ title, children }) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <span className="app-shell__spacer" aria-hidden="true" />
        <h1 className="app-shell__title">{title}</h1>
        <AppMenu />
      </header>

      <main className="app-shell__main">{children}</main>

      <SiteFooter tone="light" />
    </div>
  );
}
