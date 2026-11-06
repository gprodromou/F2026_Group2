// LogoutButton.jsx: the "Log out" button (RQ04, UC03).
// UC03 main flow: the user clicks log out -> the session ends -> back to the login page.
// Our login is a token, not a server session, so "ending the session" means forgetting
// the token in the browser (signOut in state/AuthContext.jsx). replace: true means the
// browser Back button does not return to the page the user just left.

import { useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../state/AuthContext';

export default function LogoutButton({ variant = 'secondary' }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <Button variant={variant} onClick={handleLogout}>
      Log out
    </Button>
  );
}
