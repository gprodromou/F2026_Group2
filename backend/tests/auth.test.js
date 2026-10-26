// auth.test.js: checks the register and login routes (TC03).
// Use a temporary database in memory, so the real fitness.db is not touched.

process.env.DB_FILE = ':memory:';

const request = require('supertest');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');
const password = require('../src/auth/password');

// Create the tables in the temporary database, then load the app.
migrate(db);
const app = require('../src/app');

// The user we use in all the tests below.
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'secret123',
  dateOfBirth: '2000-01-01',
  height: 180,
  weight: 75,
};

test('register: a valid signup returns 201 and saves a hashed password', async () => {
  const res = await request(app).post('/auth/register').send(testUser);
  expect(res.statusCode).toBe(201);

  const saved = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(testUser.email);
  expect(saved.password_hash).not.toBe(testUser.password);
  expect(await password.checkPassword(testUser.password, saved.password_hash)).toBe(true);
});

test('register: the same email a second time is refused with 409', async () => {
  const res = await request(app).post('/auth/register').send(testUser);
  expect(res.statusCode).toBe(409);
});

test('register: a signup without a password is refused with 400', async () => {
  const res = await request(app).post('/auth/register').send({ name: 'No Password', email: 'np@example.com' });
  expect(res.statusCode).toBe(400);
});

test('login: the correct email and password return 200 and a token', async () => {
  const res = await request(app).post('/auth/login').send({ email: testUser.email, password: testUser.password });
  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeTruthy();
});

test('login: a wrong password is refused with 401', async () => {
  const res = await request(app).post('/auth/login').send({ email: testUser.email, password: 'wrongpassword' });
  expect(res.statusCode).toBe(401);
});

test('login: an email that is not registered is refused with 401', async () => {
  const res = await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'secret123' });
  expect(res.statusCode).toBe(401);
});