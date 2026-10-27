// jwt.js: makes the login tokens and checks them.
const jwt = require('jsonwebtoken');

// Retrieves the JWT secret from the application configuration (loaded via environment variables).
const config = require('../config');

// createToken: when a user logs in with the right email and password, Marius's login code (routes/auth.js) calls this function to give them a token.
// So it gives back a token (a long string) that the frontend sends with every request later.
function createToken(user) {
  // Anyone can read what is inside a token, so we only put the user's id and role, never the password or email.
  const payload = { user_id: user.user_id, role: user.role };

  // Sign the payload with our secret, so nobody can change it, and make it expire after 1 day.
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });
}

// verifyToken: this function checks that a token is real (signed with our secret) and not expired.
// If it is fine, it gives back the payload ({ user_id, role }). If not, it throws an error.
// The authentication middleware (week 3) will call this on every protected request.
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

// Share both functions with the rest of the project.
module.exports = { createToken, verifyToken };