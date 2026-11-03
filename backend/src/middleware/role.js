// role.js: this file is the role guard (NFR02: role-based access, User vs Admin).
// It must come after requireAuth (auth.js), which reads the token and saves the user in req.user. 

// The function requireRole makes a guard for the roles we choose.
// Example: requireRole('admin') makes a guard that only lets admins through.
// "...roles" puts everything we pass in into a list, for example ['admin'].
function requireRole(...roles) {
  // This inner function is the guard that Express runs.
  // It still remembers the "roles" list from above.
  return function (req, res, next) {
    // No user means requireAuth did not run first, so treat it as not logged in (error 401).
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    // Logged in, but the role is not on the list, so refuse with an error 403.
    // Error 401 means "we don't know who you are". Error 403 means "we know you, but you are not allowed".
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // Right role. Let the request move on to the route.
    return next();
  };
}

// Share it so the admin routes and the tests can require it.
module.exports = { requireRole };