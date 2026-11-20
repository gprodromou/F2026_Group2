// RequireAdmin.jsx: lets only a signed-in admin see the page inside it.
// This only decides what the screen shows. The server still refuses non-admins (403) on every request.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

export default function RequireAdmin({ children }) {
  const { isSignedIn, user } = useAuth();

  // Not signed in: go to the login page.
  if (!isSignedIn) return <Navigate to="/login" replace />;

  // Signed in, but not an admin: go to the home page.
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}