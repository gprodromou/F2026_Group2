// twofactor.test.js: checks 2FA (TC04).
// It tests the setup and enable routes, and the login with a 2FA code.
// (tests/setup.js already gives the tests a temporary database in memory.)

const request = require('supertest');
const { authenticator } = require('otplib');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');

// Make the tables (001 and 002) in the test database, then load the app.
migrate(db);
const app = require('../src/app');

// The user for all the tests below.
const email = '2fa@example.com';
const pass = 'secret123';

// These are filled in by the tests as they run, and used by the next tests.
let token;  // the login token
let secret; // the 2FA secret key

// Test 1: the migration 002 added the 2 new columns.
test('the users table has the 2FA columns', () => {
  const columns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
  expect(columns).toContain('totp_secret');
  expect(columns).toContain('totp_enabled');
});

// Test 2: a new user (2FA off) logs in with only email and password.
test('login without 2FA works and gives a token', async () => {
  await request(app).post('/auth/register').send({ name: 'Anna', email: email, password: pass });
  const res = await request(app).post('/auth/login').send({ email: email, password: pass });
  expect(res.statusCode).toBe(200);
  token = res.body.token;
});

// Test 3: setup without logging in is refused.
test('setup without a token is refused with 401', async () => {
  const res = await request(app).post('/auth/2fa/setup');
  expect(res.statusCode).toBe(401);
});

// Test 4: setup with the token gives back a secret key.
test('setup with a token gives a secret key', async () => {
  const res = await request(app).post('/auth/2fa/setup').set('Authorization', 'Bearer ' + token);
  expect(res.statusCode).toBe(200);
  expect(res.body.secret).toBeTruthy();
  secret = res.body.secret;
});

// Test 5: enable with a wrong code is refused.
test('enable with a wrong code is refused with 400', async () => {
  const res = await request(app)
    .post('/auth/2fa/enable')
    .set('Authorization', 'Bearer ' + token)
    .send({ code: '000000' });
  expect(res.statusCode).toBe(400);
});

// Test 6: enable with the right code turns 2FA on.
test('enable with the right code turns 2FA on', async () => {
  // Make the same code the phone app would show right now.
  const code = authenticator.generate(secret);
  const res = await request(app)
    .post('/auth/2fa/enable')
    .set('Authorization', 'Bearer ' + token)
    .send({ code: code });
  expect(res.statusCode).toBe(200);
});

// Test 7: now login without a code is refused.
test('login without the code is refused with 401', async () => {
  const res = await request(app).post('/auth/login').send({ email: email, password: pass });
  expect(res.statusCode).toBe(401);
});

// Test 8: login with a wrong code is refused.
test('login with a wrong code is refused with 401', async () => {
  const res = await request(app).post('/auth/login').send({ email: email, password: pass, code: '000000' });
  expect(res.statusCode).toBe(401);
});

// Test 9: login with the right code works.
test('login with the right code gives a token', async () => {
  const code = authenticator.generate(secret);
  const res = await request(app).post('/auth/login').send({ email: email, password: pass, code: code });
  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeTruthy();
});