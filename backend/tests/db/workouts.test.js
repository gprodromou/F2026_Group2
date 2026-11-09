// This file checks the workout queries (RQ06, RQ07, NFR03).

// A temporary database that lives only in memory.
process.env.DB_FILE = ':memory:';

const db = require('../../src/db/connection');
const { migrate } = require('../../src/db/migrate');
const workouts = require('../../src/db/workouts');

// Two users, so we can check that one never sees the other's workouts.
let userA;
let userB;

// Before the tests: create the tables, then add the two users.
// A workout must belong to a real user (foreign key), so the users come first.
beforeAll(() => {
  migrate(db);
  const addUser = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  userA = addUser.run('User A', 'a@example.com', 'not-a-real-hash').lastInsertRowid;
  userB = addUser.run('User B', 'b@example.com', 'not-a-real-hash').lastInsertRowid;
});

// A workout to save in both tests.
const run = { workoutDate: '2026-11-09', exerciseType: 'Running', duration: 30, caloriesBurned: 300, equipmentUsed: 'None' };

// Test 1: a saved workout comes back in that user's list (RQ06, RQ07).
test('a saved workout is listed for its user', () => {
  workouts.createWorkout(userA, run);           // Save one workout for user A (RQ06: record a workout).
  const list = workouts.listWorkouts(userA);    // Read back all of user A's workouts (RQ07: view workouts).
  expect(list.length).toBe(1);                  // User A has exactly one workout, the one we just saved.
  
  // It is the right workout: the type we saved was 'Running'.
  // The column is exercise_type because that is its name in the database.
  expect(list[0].exercise_type).toBe('Running');
});

// Test 2: the list returns only the rows of that user (NFR03).
// The database is shared between the tests, so user A still has the workout from Test 1.
test('a user only sees their own workouts', () => {
  workouts.createWorkout(userB, run);           // User B saves a workout too, so now there are two workouts in the table.
  const list = workouts.listWorkouts(userA);    // Ask for user A's workouts again.
  expect(list.length).toBe(1);                  // Still only one workout: user B's workout did not show up for user A.

  // Check every row that came back: each one must belong to user A.
  // .every() returns true only if the check is true for all rows.
  expect(list.every((w) => w.user_id === userA)).toBe(true);
});