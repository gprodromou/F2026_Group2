// auth.test.js: this file proves the login guard works through the real app (NFR03, first half).
// tests/setup.js gives these tests their own secret ('test-secret').

// supertest sends fake requests to the app without starting a server.
const request = require('supertest');
// The real app. /me is the protected route created in app.js (app.get('/me', requireAuth, ...)).
const app = require('../../src/app');
// createToken from src/auth/jwt.js, to make a real token like the login route does.
const { createToken } = require('../../src/auth/jwt');

// Group the tests for the login guard under one name.
describe('requireAuth on GET /me', () => {
  // Test 1: no token means 401.
  // "async" and "await" make the test wait for the answer before checking it.
  test('no token gives 401', async () => {
    // Send a request to /me without a token (like someone who never logged in).
    const res = await request(app).get('/me');
    // The guard must refuse with 401.
    expect(res.status).toBe(401);
  });

  // Test 2: a real token means 200 and the user's details.
  test('a real token gives 200 and the user', async () => {
    // Make a real token, like the login route does.
    const token = createToken({ user_id: 1, role: 'user' });
    // Send a request to /me with the token in the header (like a logged-in user).
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    // The guard must let it through.
    expect(res.status).toBe(200);
    // /me must send back the same user that was in the token.
    expect(res.body.user).toEqual({ user_id: 1, role: 'user' });
  });
});