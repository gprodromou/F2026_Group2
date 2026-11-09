// workouts.test.js: checks the workout routes (TC10).
// Add, list (with a date filter), see one, edit and delete,
// and that a user can never see or change another user's workout.

const request = require('supertest');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');

// Make the tables in the test database, then load the app.
migrate(db);
const app = require('../src/app');

// Two users: Anna owns the workout, Ben tries to reach it.
let annaToken;
let benToken;
let workoutId; // filled in by the "add" test

// A workout to send in the tests.
const run = { workoutDate: '2026-11-09', exerciseType: 'Running', duration: 30, caloriesBurned: 300, equipmentUsed: 'None' };

// Register and log in a user, and give back their token.
async function loginAs(name, email) {
  await request(app).post('/auth/register').send({ name: name, email: email, password: 'secret123' });
  const res = await request(app).post('/auth/login').send({ email: email, password: 'secret123' });
  return res.body.token;
}

// Before the tests: make the two users.
beforeAll(async () => {
  annaToken = await loginAs('Anna', 'anna@example.com');
  benToken = await loginAs('Ben', 'ben@example.com');
});

// Test 1: no token, no workouts.
test('without a token the workouts are refused with 401', async () => {
  const res = await request(app).get('/workouts');
  expect(res.statusCode).toBe(401);
});

// Test 2: add a workout.
test('add a workout returns 201 and its id', async () => {
  const res = await request(app).post('/workouts').set('Authorization', 'Bearer ' + annaToken).send(run);
  expect(res.statusCode).toBe(201);
  workoutId = res.body.workoutId;
});

// Test 3: a workout without a duration is refused.
test('add a workout without a duration returns 400', async () => {
  const res = await request(app)
    .post('/workouts')
    .set('Authorization', 'Bearer ' + annaToken)
    .send({ workoutDate: '2026-11-09', exerciseType: 'Running' });
  expect(res.statusCode).toBe(400);
});

// Test 4: list my workouts, with and without a date filter.
test('list returns my workout, and the date filter works', async () => {
  const all = await request(app).get('/workouts').set('Authorization', 'Bearer ' + annaToken);
  expect(all.statusCode).toBe(200);
  expect(all.body.length).toBe(1);

  const inside = await request(app).get('/workouts?from=2026-11-01&to=2026-11-30').set('Authorization', 'Bearer ' + annaToken);
  expect(inside.body.length).toBe(1);

  const outside = await request(app).get('/workouts?from=2026-12-01').set('Authorization', 'Bearer ' + annaToken);
  expect(outside.body.length).toBe(0);
});

// Test 5: see one workout.
test('see one workout returns 200', async () => {
  const res = await request(app).get('/workouts/' + workoutId).set('Authorization', 'Bearer ' + annaToken);
  expect(res.statusCode).toBe(200);
  expect(res.body.exercise_type).toBe('Running');
});

// Test 6: another user cannot see it.
test('another user gets 404 for my workout', async () => {
  const res = await request(app).get('/workouts/' + workoutId).set('Authorization', 'Bearer ' + benToken);
  expect(res.statusCode).toBe(404);
});

// Test 7: edit my workout.
test('edit a workout returns 200 and saves the change', async () => {
  const changed = { workoutDate: '2026-11-09', exerciseType: 'Cycling', duration: 45 };
  const res = await request(app).put('/workouts/' + workoutId).set('Authorization', 'Bearer ' + annaToken).send(changed);
  expect(res.statusCode).toBe(200);

  const check = await request(app).get('/workouts/' + workoutId).set('Authorization', 'Bearer ' + annaToken);
  expect(check.body.exercise_type).toBe('Cycling');
});

// Test 8: another user cannot edit or delete it.
test('another user cannot edit or delete my workout (404)', async () => {
  const edit = await request(app).put('/workouts/' + workoutId).set('Authorization', 'Bearer ' + benToken).send(run);
  expect(edit.statusCode).toBe(404);

  const del = await request(app).delete('/workouts/' + workoutId).set('Authorization', 'Bearer ' + benToken);
  expect(del.statusCode).toBe(404);
});

// Test 9: delete my workout.
test('delete a workout returns 200, and then it is gone', async () => {
  const res = await request(app).delete('/workouts/' + workoutId).set('Authorization', 'Bearer ' + annaToken);
  expect(res.statusCode).toBe(200);

  const check = await request(app).get('/workouts/' + workoutId).set('Authorization', 'Bearer ' + annaToken);
  expect(check.statusCode).toBe(404);
});