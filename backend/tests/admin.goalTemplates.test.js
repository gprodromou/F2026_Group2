// admin.goalTemplates.test.js: checks the goal template routes.


process.env.DB_FILE = ':memory:';

const request = require('supertest');
const db = require('../src/db/connection');
const { migrate } = require('../src/db/migrate');
const jwt = require('../src/auth/jwt');


migrate(db);
const app = require('../src/app');


const adminRow = db
  .prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)')
  .run('Test Admin', 'admin@example.com', 'not-a-real-hash');
const adminId = Number(adminRow.lastInsertRowid);


const adminToken = jwt.createToken({ user_id: adminId, role: 'admin' });
const userToken = jwt.createToken({ user_id: 2, role: 'user' });

const goal = { templateName: 'Run 5 km', goalType: 'distance', description: 'Build up slowly' };
let createdId;

test('create: an admin can create a goal template (201)', async () => {
  const res = await request(app)
    .post('/admin/goal-templates')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(goal);
  expect(res.statusCode).toBe(201);
  createdId = res.body.goalTemplateId;
  expect(createdId).toBeTruthy();
});

test('create: a template without a goal type is refused with 400', async () => {
  const res = await request(app)
    .post('/admin/goal-templates')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ templateName: 'No type' });
  expect(res.statusCode).toBe(400);
});

test('read: an admin can list the templates and read one', async () => {
  const list = await request(app).get('/admin/goal-templates').set('Authorization', `Bearer ${adminToken}`);
  expect(list.statusCode).toBe(200);
  expect(list.body.length).toBe(1);

  const one = await request(app).get(`/admin/goal-templates/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
  expect(one.statusCode).toBe(200);
  expect(one.body.template_name).toBe('Run 5 km');
});

test('read: a template that does not exist returns 404', async () => {
  const res = await request(app).get('/admin/goal-templates/9999').set('Authorization', `Bearer ${adminToken}`);
  expect(res.statusCode).toBe(404);
});

test('update: an admin can update a goal template', async () => {
  const res = await request(app)
    .put(`/admin/goal-templates/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ templateName: 'Run 10 km', goalType: 'distance', description: 'Longer target' });
  expect(res.statusCode).toBe(200);

  const one = await request(app).get(`/admin/goal-templates/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
  expect(one.body.template_name).toBe('Run 10 km');
});

test('non-admin: an ordinary user gets 403 on every route', async () => {
  const header = `Bearer ${userToken}`;
  expect((await request(app).post('/admin/goal-templates').set('Authorization', header).send(goal)).statusCode).toBe(403);
  expect((await request(app).get('/admin/goal-templates').set('Authorization', header)).statusCode).toBe(403);
  expect((await request(app).put(`/admin/goal-templates/${createdId}`).set('Authorization', header).send(goal)).statusCode).toBe(403);
  expect((await request(app).delete(`/admin/goal-templates/${createdId}`).set('Authorization', header)).statusCode).toBe(403);
});

test('no token: a request without login is refused with 401', async () => {
  const res = await request(app).get('/admin/goal-templates');
  expect(res.statusCode).toBe(401);
});

test('delete: an admin can delete a goal template', async () => {
  const res = await request(app)
    .delete(`/admin/goal-templates/${createdId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  expect(res.statusCode).toBe(200);

  const again = await request(app).get(`/admin/goal-templates/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
  expect(again.statusCode).toBe(404);
});