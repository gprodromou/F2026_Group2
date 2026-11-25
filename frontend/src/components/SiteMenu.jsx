// SiteMenu.jsx: the three-line menu button (Yanna, week 7). Used by the Login / Register frame,
// and by the main header (Layout) when someone is signed in.
// Clicking it slides a panel in from the right with:
//   signed out: Home, About, Services, Contact us, then Log in and Register
//   signed in:  Home, Log Workout, History, Goals (+ Admin for administrators), then Log out
//               (the same links as Nav.jsx, so the two can never disagree)
// About / Services / Contact us are sections of the Landing page (/#about ...), the same
// links as the main header (Nav.jsx).
//
// The panel closes when: a link is chosen, the X is pressed, Escape is pressed, or the
// dark area beside it is clicked. Focus moves into the panel when it opens and back to
// the three-line button when it closes, so it also works with the keyboard alone.
//
// The panel is always in the page (so it can slide out smoothly), but while closed it is
// aria-hidden and inert: screen readers and the Tab key skip it.

import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { useAuth } from '../state/AuthContext';
import { SIGNED_IN_LINKS, ADMIN_LINKS } from './Nav';
import './SiteMenu.css';

const PUBLIC_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/#about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#contact', label: 'Contact us' },
];

export default function SiteMenu() {
  const { isSignedIn, user } = useAuth();
  const isAdmin = isSignedIn && String(user.role).toLowerCase() === 'admin';
  let links = PUBLIC_LINKS;
  if (isSignedIn) links = isAdmin ? [...SIGNED_IN_LINKS, ...ADMIN_LINKS] : SIGNED_IN_LINKS;
  const [open, setOpen] = useState(false);
  const openButton = useRef(null);
  const closeButton = useRef(null);
  const wasOpen = useRef(false);
  const panelId = useId();

  // Escape closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Move focus into the panel when it opens, and back to the button when it closes.
  useEffect(() => {
    if (open) closeButton.current?.focus();
    else if (wasOpen.current) openButton.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={openButton}
        type="button"
        className="site-menu__button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <span className="site-menu__bar" />
        <span className="site-menu__bar" />
        <span className="site-menu__bar" />
      </button>

      <div
        className={`site-menu__overlay${open ? ' site-menu__overlay--open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        id={panelId}
        className={`site-menu__panel${open ? ' site-menu__panel--open' : ''}`}
        aria-hidden={open ? undefined : 'true'}
        inert={open ? undefined : ''}
      >
        <button
          ref={closeButton}
          type="button"
          className="site-menu__close"
          aria-label="Close menu"
          onClick={close}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <nav className="site-menu__nav" aria-label="Site menu">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="site-menu__link" onClick={close}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-menu__actions">
          {isSignedIn ? (
            <LogoutButton />
          ) : (
            <>
              <Link to="/login" className="nav-button nav-button--primary" onClick={close}>
                Log in
              </Link>
              <Link to="/register" className="nav-button nav-button--secondary" onClick={close}>
                Register
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
