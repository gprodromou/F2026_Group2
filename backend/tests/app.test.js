// app.test.js: automated checks for the backend.
// Run with "npm test" (inside the backend folder).

// A library named Jest runs the tests and reports pass or fail.
// Another library named Supertest sends fake requests straight to the app, without starting the real server. 
// This is why app.js and server.js are separate files.
// "test" and "expect" don't need a require: Jest provides them automatically.

// Supertest: the "fake browser" that sends requests to the app.
const request = require('supertest');

// "../" means one folder up: from tests/ back to backend/, then into src/.
const app = require('../src/app');

// The database connection the app shares (used in Test 3).
const db = require('../src/db/connection');

// Test 1: the health route works and the database answers.
// Sending a request takes a moment, so the test is marked "async", and "await" means: wait for the response before checking it.
test('GET /health returns ok and database connected', async () => {
  // Pretend a browser visited /health, and keep the response in "res".
  const res = await request(app).get('/health');

  // statusCode is the number the server answered with. 200 means success.
  // toBe checks that a simple value (like a number) is exactly equal.
  expect(res.statusCode).toBe(200);

  // body is the JSON the server sent back.
  // toEqual compares objects by their contents, field by field.
  // (toBe would fail here, because it checks if they are the same object in memory.)
  expect(res.body).toEqual({ status: 'ok', database: 'connected' });
});

// Test 2: a route that doesn't exist gives 404 ("not found").
// This proves the app rejects unknown URLs instead of crashing or sending back something wrong.
test('GET an unknown route returns 404', async () => {
  // A made-up URL that no route in app.js handles.
  const res = await request(app).get('/this-route-does-not-exist');

  // Express answers 404 by itself when no route matches.
  expect(res.statusCode).toBe(404);
});

// Test 3: foreign keys are switched on.
// SQLite leaves them off by default; connection.js turns them on.
// This test is not async, because asking SQLite a setting is instant.
test('database connection has foreign keys switched on', () => {
  // Ask SQLite for the current value of the foreign_keys setting.
  // { simple: true } returns just the number: 1 means on, 0 means off.
  expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
});

// Test 4 (NFR11): broken JSON from the client gets an error 400 ("your mistake"), not a 500 ("server error").
test('broken JSON in a request body answers 400', async () => {
  // '{"email": ' is cut off halfway, so express.json cannot read it.
  const res = await request(app).post('/auth/login').set('Content-Type', 'application/json').send('{"email": ');
  expect(res.statusCode).toBe(400);
});

// Test 5 (NFR11): the server refuses to start without JWT_SECRET, instead of failing every login later.
// spawnSync runs the real server.js as a separate program, with an empty secret, and waits for it to stop.
test('server.js stops at once when JWT_SECRET is missing', () => {
  const { spawnSync } = require('child_process');
  const path = require('path');
  const run = spawnSync('node', [path.join(__dirname, '..', 'src', 'server.js')], {
    env: { ...process.env, JWT_SECRET: '', PORT: '0' },
    timeout: 5000,
  });
  // Exit code 1 means it stopped on purpose. Without the check it would keep running until the 5 second timeout.
  expect(run.status).toBe(1);
});