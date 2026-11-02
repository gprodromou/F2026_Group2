// auth.js: this file is the login guard. First half of NFR03: only logged-in users get through.
// Express runs this before the routes we attach it to. A real token lets the request in. Anything else gets the 401 error.

// verifyToken comes from src/auth/jwt.js.
// It checks the token's signature and expiry date, and gives an error if either is wrong.
const { verifyToken } = require('../auth/jwt');

// Express calls this function with three things:
//   req  = the request that came in (headers, URL, body)
//   res  = the response we can send back
//   next = call this when we're happy, and Express moves on to the route
// Basically check if the user has a valid login token before letting them through to the route.
function requireAuth(req, res, next) {
  // Get the header that contains the token.
  // If there isn't one, use '' (empty text) so the next line doesn't crash.
  const header = req.get('Authorization') || '';

  // Split it into the word "Bearer" and the token itself, token = 'eyJ...'.
  const [scheme, token] = header.split(' ');

  // If it's missing or formatted wrong, stop and send an error 401.
  // "return" stops here, so the route never runs.
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Login required' });
  }

  // try/catch: verifyToken throws on a bad token, and catch handles that case.
  try {
    // Check if the token is real and read the data inside it.
    const payload = verifyToken(token);

    // Save the user info to 'req' so the next route can use it.
    req.user = { user_id: payload.user_id, role: payload.role };

    // Success. Let the request move on to the route.
    return next();
  } catch (err) {
    // If the token is fake, changed, or expired, block the request
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Share it so app.js and the tests can require it.
module.exports = { requireAuth };