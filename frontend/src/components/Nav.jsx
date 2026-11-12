// Nav.jsx: the main navigation, with three states (NFR02, NFR05):
//   signed out            -> Home, Sign up, Sign in
//   signed in             -> Home, Log out
//   signed in as an admin -> Home, Admin, Log out
// Who is looking comes from Bogdan C's context (state/AuthContext.jsx), through useAuth().
// Log out is his LogoutButton, which forgets the token and returns to the login page.
// To add a page to the navigation later, add one line to the right list below.
//
// Hiding a link only changes what is SHOWN. The real protection is on the server:
// middleware/role.js refuses non-admins, so a hidden link was never the lock.

import { NavLink } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { useAuth } from '../state/AuthContext';

const SIGNED_OUT_LINKS = [{ to: '/', label: 'Home', end: true }];
const SIGNED_IN_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/workouts/new', label: 'Log workout' },
];
const ADMIN_LINKS = [{ to: '/admin', label: 'Admin' }]; // shown to administrators only

export default function Nav() {
  const { user, isSignedIn } = useAuth();
  const isAdmin = isSignedIn && String(user.role).toLowerCase() === 'admin';

  // Pick the links for the current state.
  let links = SIGNED_OUT_LINKS;
  if (isSignedIn) links = SIGNED_IN_LINKS;
  if (isAdmin) links = [...SIGNED_IN_LINKS, ...ADMIN_LINKS];

  return (
    <nav className="layout__nav" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className="nav-link">
          {link.label}
        </NavLink>
      ))}

      {isSignedIn ? (
        <LogoutButton />
      ) : (
        <>
          <NavLink to="/register" className="nav-button nav-button--secondary">
            Sign up
          </NavLink>
          <NavLink to="/login" className="nav-button nav-button--primary">
            Sign in
          </NavLink>
        </>
      )}
    </nav>
  );
}
