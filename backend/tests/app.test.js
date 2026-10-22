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