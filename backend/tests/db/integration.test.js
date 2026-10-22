// Checks that the migrations work together with the app's shared connection.

// Use an in-memory database for this test, so the real fitness.db is not touched.
// This must be set BEFORE connection.js is loaded.
process.env.DB_FILE = ':memory:';

const request = require('supertest');
const db = require('../../src/db/connection');
const app = require('../../src/app');
const { migrate } = require('../../src/db/migrate');

test('the migrations create the tables on the app connection', () => {
  migrate(db);

  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  const tableNames = rows.map((row) => row.name);

  expect(tableNames).toContain('users');
  expect(tableNames).toContain('workouts');
});

test('the app connection has foreign keys switched on', () => {
  const addWorkout = () =>
    db.prepare('INSERT INTO workouts (user_id, workout_date, exercise_type, duration) VALUES (?, ?, ?, ?)')
      .run(999, '2026-10-21', 'Running', 30);

  expect(addWorkout).toThrow('FOREIGN KEY');
});

test('GET /health still works after migrating', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
});
