
//Checks that a template can be used properly


process.env.DB_FILE = ':memory:';

const db = require('../../src/db/connection');
const { migrate } = require('../../src/db/migrate');
const templates = require('../../src/db/templates');


let adminId;
beforeAll(() => {
  migrate(db);
  const result = db
    .prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)')
    .run('Test Admin', 'admin@example.com', 'not-a-real-hash');
  adminId = result.lastInsertRowid;
});

test('an exercise template can be inserted, listed, updated and deleted', () => {
  //Insert
  const id = templates.addExerciseTemplate(adminId, 'Beginner full body', 'Strength', 'Three days a week');

  //List
  let list = templates.listExerciseTemplates();
  expect(list.length).toBe(1);
  expect(list[0].template_name).toBe('Beginner full body');

  //Update
  const changed = templates.updateExerciseTemplate(id, 'Full body v2', 'Strength', 'Four days a week');
  expect(changed).toBe(1);
  list = templates.listExerciseTemplates();
  expect(list[0].template_name).toBe('Full body v2');

  //Delete
  const deleted = templates.deleteExerciseTemplate(id);
  expect(deleted).toBe(1);
  expect(templates.listExerciseTemplates().length).toBe(0);
});

test('a goal template can be inserted, listed, updated and deleted', () => {
  // Insert
  const id = templates.addGoalTemplate(adminId, 'Run 5 km', 'distance', 'Build up slowly');

  // List
  let list = templates.listGoalTemplates();
  expect(list.length).toBe(1);
  expect(list[0].goal_type).toBe('distance');

  // Update
  const changed = templates.updateGoalTemplate(id, 'Run 10 km', 'distance', 'Longer target');
  expect(changed).toBe(1);
  list = templates.listGoalTemplates();
  expect(list[0].template_name).toBe('Run 10 km');

  // Delete
  const deleted = templates.deleteGoalTemplate(id);
  expect(deleted).toBe(1);
  expect(templates.listGoalTemplates().length).toBe(0);
});
