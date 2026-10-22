const Database = require('better-sqlite3');
const { migrate } = require('../../src/db/migrate');

// Every test uses a new empty database that lives only in memory,
// so the tests never touch the real fitness.db file.
function newDatabase() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

test('all seven tables exist after migrating', () => {
  const db = newDatabase();
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  const tableNames = rows.map((row) => row.name);

  expect(tableNames).toContain('users');
  expect(tableNames).toContain('admins');
  expect(tableNames).toContain('workouts');
  expect(tableNames).toContain('goals');
  expect(tableNames).toContain('progress_reports');
  expect(tableNames).toContain('exercise_templates');
  expect(tableNames).toContain('goal_templates');
});

test('a workout for a user that does not exist is refused', () => {
  const db = newDatabase();
  const addWorkout = () =>
    db.prepare('INSERT INTO workouts (user_id, workout_date, exercise_type, duration) VALUES (?, ?, ?, ?)')
      .run(999, '2026-10-15', 'Running', 30);

  expect(addWorkout).toThrow('FOREIGN KEY');
});

test('two users with the same email are refused', () => {
  const db = newDatabase();
  const addUser = () =>
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run('Test', 'same@example.com', 'hash');

  addUser(); // the first one is fine
  expect(addUser).toThrow('UNIQUE'); // the second one is refused
});

test('running the migrations a second time does nothing', () => {
  const db = newDatabase();
  const appliedSecondTime = migrate(db);
  expect(appliedSecondTime).toEqual([]);
});
