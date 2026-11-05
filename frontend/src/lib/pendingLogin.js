// pendingLogin.js: holds the email and password for a few seconds while the
// user types their two-factor code. Marius's login needs email + password + code
// in ONE request, so the code screen must send the details again.
//
// The details live only in this variable (in memory). They are never written to
// localStorage or the URL, and they disappear when the page is reloaded.

let pending = null;

export function setPendingLogin(details) {
  pending = details;
}

export function getPendingLogin() {
  return pending;
}

export function clearPendingLogin() {
  pending = null;
}
