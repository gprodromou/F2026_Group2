// demo.test.js: checks the demo data and the admin login (TC23, week 6).
// The demo user and the demo admin from seed.js can log in, each gets the right role,
// and each one can only use their own part of the app (NFR02).

const request = require('supertest');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');
const { seed } = require('../src/db/seed');
const jwt = require('../src/auth/jwt');

// Make the tables and put the demo data in the test database, then load the app.
migrate(db);
seed(db);
const app = require('../src/app');

let userToken;  // the demo user's token, filled in by test 1
let adminToken; // the demo admin's token, filled in by test 2

// Test 1: the demo user logs in and gets the role 'user'.
test('the demo user can log in and gets the role user', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'demo@example.com', password: 'demo1234' });
  expect(res.statusCode).toBe(200);
  userToken = res.body.token;
  expect(jwt.verifyToken(userToken).role).toBe('user');
});

// Test 2: the demo admin logs in on the same login page and gets the role 'admin'.
test('the demo admin can log in and gets the role admin', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'admin1234' });
  expect(res.statusCode).toBe(200);
  adminToken = res.body.token;
  expect(jwt.verifyToken(adminToken).role).toBe('admin');
});

// Test 3: a wrong admin password is refused.
test('the admin with a wrong password is refused with 401', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'wrong' });
  expect(res.statusCode).toBe(401);
});

// Test 4: the admin can open the admin pages, the user cannot (NFR02).
test('only the admin can open the admin templates (user gets 403)', async () => {
  const asAdmin = await request(app).get('/admin/exercise-plans').set('Authorization', 'Bearer ' + adminToken);
  expect(asAdmin.statusCode).toBe(200);

  const asUser = await request(app).get('/admin/exercise-plans').set('Authorization', 'Bearer ' + userToken);
  expect(asUser.statusCode).toBe(403);
});

// Test 5: workouts and goals are for users only, so the admin gets 403 (NFR02).
test('the admin cannot open the user workouts and goals (403)', async () => {
  const workouts = await request(app).get('/workouts').set('Authorization', 'Bearer ' + adminToken);
  expect(workouts.statusCode).toBe(403);

  const goals = await request(app).get('/goals').set('Authorization', 'Bearer ' + adminToken);
  expect(goals.statusCode).toBe(403);
});

// Test 6: the demo user has 10 workouts to show.
test('the demo user sees 10 workouts', async () => {
  const res = await request(app).get('/workouts').set('Authorization', 'Bearer ' + userToken);
  expect(res.statusCode).toBe(200);
  expect(res.body.length).toBe(10);
});

// Test 7: the demo goals show all three statuses (RQ11).
test('the demo goals are active, completed and expired', async () => {
  const res = await request(app).get('/goals').set('Authorization', 'Bearer ' + userToken);
  const statuses = res.body.map((goal) => goal.status).sort();
  expect(statuses).toEqual(['active', 'completed', 'expired']);
});
