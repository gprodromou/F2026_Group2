// This test file proves goal status and progress are worked out correctly and stay private (RQ11, RQ13, NFR03).
// tests/setup.js runs before this file and gives the tests:
//   - an empty database in memory, so the real fitness.db is never touched
//   - a test-only secret, so createToken works even without a .env file

const request = require('supertest');                   // supertest sends fake web requests to the app without starting a real server.
const db = require('../../src/db/connection');          // The same database connection the app uses (in memory during tests).
const app = require('../../src/app');                   // The Express app from app.js, with all its routes.
const { migrate } = require('../../src/db/migrate');    // migrate creates the tables (users, workouts, goals...) in the empty test database.
const { createToken } = require('../../src/auth/jwt');  // createToken makes a login token, so we can act as a logged-in user without going through /auth/login.
const workouts = require('../../src/db/workouts');      // The workout queries, to add workouts the goals can count.
const goals = require('../../src/db/goals');            // The file we are testing (goals.js).

// Anna has two 300-calorie workouts in November and two goals. Ben has one goal.
let anna;
let ben;
let calorieGoal;

// beforeAll runs once, before all the tests, to fill the database with the test data.
beforeAll(() => {
  // Build the tables.
  migrate(db);

  // Same way as tests/db/workouts.test.js: a goal must belong to a real user (foreign key).
  // lastInsertRowid is the user_id SQLite gave the new user.
  const addUser = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  anna = addUser.run('Anna', 'anna@example.com', 'not-a-real-hash').lastInsertRowid;
  ben = addUser.run('Ben', 'ben@example.com', 'not-a-real-hash').lastInsertRowid;

  // Two workouts for Anna, 300 calories each, so 600 in total.
  workouts.createWorkout(anna, { workoutDate: '2026-11-02', exerciseType: 'Running', duration: 30, caloriesBurned: 300, equipmentUsed: null });
  workouts.createWorkout(anna, { workoutDate: '2026-11-09', exerciseType: 'Cycling', duration: 60, caloriesBurned: 300, equipmentUsed: 'Bike' });

  // Reached: 600 calories against a target of 500, deadline far in the future.
  // We keep its goal_id in calorieGoal for tests 2 and 3.
  calorieGoal = goals.createGoal(anna, { goalType: 'calories', targetValue: 500, targetDate: '2099-12-31' });
  // Missed: 5 workouts by 31 Jan 2026, and both workouts came after that date.
  goals.createGoal(anna, { goalType: 'workouts', targetValue: 5, targetDate: '2026-01-31' });

  // Ben's goal sits in the same table, so we can check Anna never gets it.
  goals.createGoal(ben, { goalType: 'duration', targetValue: 100, targetDate: '2099-12-31' });
});

// Test 1 (RQ11, NFR03): through the real app, Anna gets only her two goals, one completed and one expired.
test('GET /goals returns only my goals, each with its status for today', async () => {
  // Log in as Anna by making her a token.
  const token = createToken({ user_id: anna, role: 'user' });

  // Call GET /goals with the token in the Authorization header, the way the website does.
  // "await" waits for the answer before going to the next line.
  const res = await request(app).get('/goals').set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);                                                         // 200 = success.
  expect(res.body.every((g) => g.user_id === anna)).toBe(true);                   // Every goal that came back is Anna's, so Ben's goal was left out.
  expect(res.body.map((g) => g.status).sort()).toEqual(['completed', 'expired']); // Take each goal's status and sort them, so the order of the goals doesn't matter.
});

// Test 2 (RQ13): progress adds up the workouts, and percentage stops at 100.
test('progress is worked out from the workouts and capped at 100 percent', () => {
  // Ask for the progress of Anna's calorie goal, as Anna.
  const progress = goals.getGoalProgress(calorieGoal, anna);

  expect(progress.current).toBe(600);           // 300 + 300 = 600 calories.
  expect(progress.percent).toBe(100);           // 600 of 500 would be 120%, but it stops at 100 percent.
  expect(progress.status).toBe('completed');    // Target reached, so the goal is completed.
});

// Test 3 (NFR03): Ben cannot read the progress of Anna's goal, even if he knows its number.
test("another user cannot read the progress of a goal that is not theirs", () => {
  // Anna's goal id, but asked as Ben: nothing comes back (undefined), the same as a goal that doesn't exist.
  expect(goals.getGoalProgress(calorieGoal, ben)).toBeUndefined();
});