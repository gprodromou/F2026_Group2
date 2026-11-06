// AuthContext.jsx: who is signed in, shared with every component (RQ04, UC03).
// React Context lets any component read this without passing it down by hand.
//
//   const { user, token, isSignedIn, signIn, signOut } = useAuth();
//
//   user        { userId, role } read from the token, or null when signed out
//   token       the login token (lib/token.js keeps it in localStorage)
//   isSignedIn  true / false
//   signIn(t)   save a new token (Login, TwoFactorVerify, Register call this)
//   signOut()   forget the token and the pending 2FA details (LogoutButton calls this)
//
// The token is a JWT made by George's backend/src/auth/jwt.js. Its middle part is
// plain JSON ({ user_id, role, exp }) that anyone can read, so we read the role from it
// to decide what to show. This is ONLY for the screen: the server still checks the
// signature on every request, so changing the token in the browser gives no access.

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getToken, saveToken, clearToken } from '../lib/token';
import { clearPendingLogin } from '../lib/pendingLogin';

// Reads { user_id, role, exp } out of a JWT. Returns null if it is not a readable,
// unexpired token, so a broken or old token simply means "signed out".
export function readToken(token, now = Date.now()) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    // JWT uses base64url: '-' and '_' instead of '+' and '/', and no '=' padding.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= now) return null; // expired
    if (payload.user_id === undefined) return null;
    return { userId: payload.user_id, role: payload.role || 'user' };
  } catch {
    return null;
  }
}

// Used when a component is shown WITHOUT the provider (for example in a page's own test).
// signIn and signOut still save and clear the token, they just do not update any screen.
const fallback = {
  token: null,
  user: null,
  isSignedIn: false,
  signIn: saveToken,
  signOut: () => {
    clearToken();
    clearPendingLogin();
  },
};

const AuthContext = createContext(fallback);

// Wraps the whole app in App.jsx, so every page can call useAuth().
export function AuthProvider({ children }) {
  // Read the saved token once, when the app opens. An unreadable or expired one is removed.
  const [token, setToken] = useState(() => {
    const saved = getToken();
    if (saved && !readToken(saved)) {
      clearToken();
      return null;
    }
    return saved;
  });

  const signIn = useCallback((newToken) => {
    saveToken(newToken);
    setToken(newToken);
  }, []);

  const signOut = useCallback(() => {
    clearToken();        // the token is gone from localStorage
    clearPendingLogin(); // and so is any half-finished two-factor login
    setToken(null);      // every component that uses useAuth() redraws as signed out
  }, []);

  const value = useMemo(() => {
    const user = readToken(token);
    return { token: user ? token : null, user, isSignedIn: Boolean(user), signIn, signOut };
  }, [token, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
