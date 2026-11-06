// admin.exercisePlans.test.js: checks the exercise plan template routes.
// Use a temporary database in memory, so the real fitness.db is not touched.

process.env.DB_FILE = ':memory:';

const request = require('supertest');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');
const jwt = require('../src/auth/jwt');

// Create the tables in the temporary database, then load the app.
migrate(db);
const app = require('../src/app');

// Templates belong to an admin, so one admin row must exist (foreign keys are on).
const adminRow = db
  .prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)')
  .run('Test Admin', 'admin@example.com', 'not-a-real-hash');
const adminId = Number(adminRow.lastInsertRowid);

// Two tokens: one for an admin and one for an ordinary user.
const adminToken = jwt.createToken({ user_id: adminId, role: 'admin' });
const userToken = jwt.createToken({ user_id: 2, role: 'user' });

const plan = { templateName: 'Beginner full body', category: 'Strength', description: 'Three days a week' };
let createdId;

test('create: an admin can create a template (201)', async () => {
  const res = await request(app)
    .post('/admin/exercise-plans')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(plan);
  expect(res.statusCode).toBe(201);
  createdId = res.body.exerciseTemplateId;
  expect(createdId).toBeTruthy();
});

test('create: a template without a name is refused with 400', async () => {
  const res = await request(app)
    .post('/admin/exercise-plans')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ category: 'Strength' });
  expect(res.statusCode).toBe(400);
});

test('read: an admin can list the templates and read one', async () => {
  const list = await request(app).get('/admin/exercise-plans').set('Authorization', `Bearer ${adminToken}`);
  expect(list.statusCode).toBe(200);
  expect(list.body.length).toBe(1);

  const one = await request(app).get(`/admin/exercise-plans/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
  expect(one.statusCode).toBe(200);
  expect(one.body.template_name).toBe('Beginner full body');
});

test('read: a template that does not exist returns 404', async () => {
  const res = await request(app).get('/admin/exercise-plans/9999').set('Authorization', `Bearer ${adminToken}`);
  expect(res.statusCode).toBe(404);
});

test('update: an admin can update a template', async () => {
  const res = await request(app)
    .put(`/admin/exercise-plans/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ templateName: 'Full body v2', category: 'Strength', description: 'Four days a week' });
  expect(res.statusCode).toBe(200);

  const one = await request(app).get(`/admin/exercise-plans/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
  expect(one.body.template_name).toBe('Full body v2');
});

test('non-admin: an ordinary user gets 403 on every route', async () => {
  const header = `Bearer ${userToken}`;
  expect((await request(app).post('/admin/exercise-plans').set('Authorization', header).send(plan)).statusCode).toBe(403);
  expect((await request(app).get('/admin/exercise-plans').set('Authorization', header)).statusCode).toBe(403);
  expect((await request(app).put(`/admin/exercise-plans/${createdId}`).set('Authorization', header).send(plan)).statusCode).toBe(403);
  expect((await request(app).delete(`/admin/exercise-plans/${createdId}`).set('Authorization', header)).statusCode).toBe(403);
});

test('no token: a request without login is refused with 401', async () => {
  const res = await request(app).get('/admin/exercise-plans');
  expect(res.statusCode).toBe(401);
});

test('delete: an admin can delete a template', async () => {
  const res = await request(app)
    .delete(`/admin/exercise-plans/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  expect(res.statusCode).toBe(200);

  const again = await request(app).get(`/admin/exercise-plans/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
  expect(again.statusCode).toBe(404);
});