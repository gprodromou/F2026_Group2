// goals.test.js: checks the goal routes (TC20).
// Create, list, see one, progress, edit and delete,
// and that a user can never see or change another user's goal.

const request = require('supertest');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');

// Make the tables in the test database, then load the app.
migrate(db);
const app = require('../src/app');

// Two users: Anna owns the goals, Ben tries to reach them.
let annaToken;
let benToken;
let goalId; // filled in by the "create" test

// Register and log in a user, and give back their token.
async function loginAs(name, email) {
  await request(app).post('/auth/register').send({ name: name, email: email, password: 'secret123' });
  const res = await request(app).post('/auth/login').send({ email: email, password: 'secret123' });
  return res.body.token;
}

// Before the tests: make the two users, and give Anna two workouts of 300 calories.
beforeAll(async () => {
  annaToken = await loginAs('Anna', 'anna@example.com');
  benToken = await loginAs('Ben', 'ben@example.com');

  const workout = { workoutDate: '2026-11-09', exerciseType: 'Running', duration: 30, caloriesBurned: 300 };
  await request(app).post('/workouts').set('Authorization', 'Bearer ' + annaToken).send(workout);
  await request(app).post('/workouts').set('Authorization', 'Bearer ' + annaToken).send(workout);
});

// Test 1: no token, no goals.
test('without a token the goals are refused with 401', async () => {
  const res = await request(app).get('/goals');
  expect(res.statusCode).toBe(401);
});

// Test 2: create a goal.
test('create a goal returns 201 and its id', async () => {
  const goal = { goalType: 'calories', targetValue: 1000, targetDate: '2030-12-31' };
  const res = await request(app).post('/goals').set('Authorization', 'Bearer ' + annaToken).send(goal);
  expect(res.statusCode).toBe(201);
  goalId = res.body.goalId;
});

// Test 3: a wrong goal is refused.
test('create a goal with a wrong type or no target returns 400', async () => {
  const wrongType = await request(app)
    .post('/goals')
    .set('Authorization', 'Bearer ' + annaToken)
    .send({ goalType: 'pizza', targetValue: 1000, targetDate: '2030-12-31' });
  expect(wrongType.statusCode).toBe(400);

  const noTarget = await request(app)
    .post('/goals')
    .set('Authorization', 'Bearer ' + annaToken)
    .send({ goalType: 'calories', targetDate: '2030-12-31' });
  expect(noTarget.statusCode).toBe(400);
});

// Test 4: list my goals, with their status.
test('list returns my goal with status active', async () => {
  const res = await request(app).get('/goals').set('Authorization', 'Bearer ' + annaToken);
  expect(res.statusCode).toBe(200);
  expect(res.body.length).toBe(1);
  expect(res.body[0].status).toBe('active');
});

// Test 5: the progress: 300 + 300 = 600 of 1000 calories = 60%.
test('progress shows 600 of 1000 calories (60%)', async () => {
  const res = await request(app).get('/goals/' + goalId + '/progress').set('Authorization', 'Bearer ' + annaToken);
  expect(res.statusCode).toBe(200);
  expect(res.body.current).toBe(600);
  expect(res.body.percent).toBe(60);
});

// Test 6: another user cannot see the goal or its progress.
test('another user gets 404 for my goal and its progress', async () => {
  const goal = await request(app).get('/goals/' + goalId).set('Authorization', 'Bearer ' + benToken);
  expect(goal.statusCode).toBe(404);

  const progress = await request(app).get('/goals/' + goalId + '/progress').set('Authorization', 'Bearer ' + benToken);
  expect(progress.statusCode).toBe(404);
});

// Test 7: edit the goal to 500 calories, so 600 reaches it: status completed.
test('edit a goal returns 200, and a reached goal is completed', async () => {
  const changed = { goalType: 'calories', targetValue: 500, targetDate: '2030-12-31' };
  const res = await request(app).put('/goals/' + goalId).set('Authorization', 'Bearer ' + annaToken).send(changed);
  expect(res.statusCode).toBe(200);

  const check = await request(app).get('/goals/' + goalId).set('Authorization', 'Bearer ' + annaToken);
  expect(check.body.status).toBe('completed');
});

// Test 8: a goal whose date has passed and was not reached is expired.
test('a goal with a past date that was not reached is expired', async () => {
  const old = { goalType: 'workouts', targetValue: 50, targetDate: '2020-01-01' };
  const created = await request(app).post('/goals').set('Authorization', 'Bearer ' + annaToken).send(old);

  const res = await request(app).get('/goals/' + created.body.goalId).set('Authorization', 'Bearer ' + annaToken);
  expect(res.body.status).toBe('expired');
});

// Test 9: another user cannot edit or delete it.
test('another user cannot edit or delete my goal (404)', async () => {
  const goal = { goalType: 'calories', targetValue: 1000, targetDate: '2030-12-31' };
  const edit = await request(app).put('/goals/' + goalId).set('Authorization', 'Bearer ' + benToken).send(goal);
  expect(edit.statusCode).toBe(404);

  const del = await request(app).delete('/goals/' + goalId).set('Authorization', 'Bearer ' + benToken);
  expect(del.statusCode).toBe(404);
});

// Test 10: delete my goal.
test('delete a goal returns 200, and then it is gone', async () => {
  const res = await request(app).delete('/goals/' + goalId).set('Authorization', 'Bearer ' + annaToken);
  expect(res.statusCode).toBe(200);

  const check = await request(app).get('/goals/' + goalId).set('Authorization', 'Bearer ' + annaToken);
  expect(check.statusCode).toBe(404);
});