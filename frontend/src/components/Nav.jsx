// Nav.jsx: the main navigation, with three states (NFR02, NFR05):
//   signed out            -> Home, About, Services (menu), Contact us, Sign up, Sign in
//   signed in             -> Home, Log Workout, History, Goals, Log out
//                            (on the Landing page these sit in the three-line menu, SiteMenu.jsx)
//   signed in as an admin -> the signed-in links + Admin (opens /admin/templates), Log out
// Who is looking comes from Bogdan C's context (state/AuthContext.jsx), through useAuth().
// Log out is his LogoutButton, which forgets the token and returns to the login page.
// To add a page to the navigation later, add one line to the right list below.
//
// About, Services and Contact us (Yanna, week 7) are sections of the Landing page, so they
// link to /#about, /#services and /#contact and Landing scrolls to them. They are plain
// Links, not NavLinks: a NavLink to "/" would light up as "active" on the home page.
//
// Hiding a link only changes what is SHOWN. The real protection is on the server:
// middleware/role.js refuses non-admins, so a hidden link was never the lock.

import { Link, NavLink } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import { useAuth } from '../state/AuthContext';

const SIGNED_OUT_LINKS = [{ to: '/', label: 'Home', end: true }];
export const SIGNED_IN_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/workouts/new', label: 'Log Workout' },
  { to: '/workouts', label: 'History', end: true },
  { to: '/goals', label: 'Goals' },
];
// Admin opens Andreas's templates screen (week 5). It used to point at /admin, which has
// no page and showed "Page not found" (fixed for the demo, week 7).
export const ADMIN_LINKS = [{ to: '/admin/templates', label: 'Admin' }]; // shown to administrators only

// The items under "Services": each scrolls to its card in the Services section.
const SERVICES = [
  { to: '/#service-workouts', label: 'Workout log' },
  { to: '/#service-goals', label: 'Goals and progress' },
  { to: '/#service-history', label: 'Workout history' },
];

// "Services" with a small menu that opens on hover or keyboard focus (CSS in Layout.css).
function ServicesMenu() {
  return (
    <div className="nav-dropdown">
      <Link to="/#services" className="nav-link nav-dropdown__toggle">
        Services
        <svg className="nav-dropdown__chevron" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Link>
      <ul className="nav-dropdown__menu">
        {SERVICES.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="nav-dropdown__item">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
          <Link to="/#about" className="nav-link">About</Link>
          <ServicesMenu />
          <Link to="/#contact" className="nav-link">Contact us</Link>
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
