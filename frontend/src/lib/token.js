// token.js: keeps the login token in the browser.
// Login.jsx and Register.jsx save it here; the app reads it from week 3.

const TOKEN_KEY = 'token';

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The browser can block storage; the user simply has to log in again.
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}
