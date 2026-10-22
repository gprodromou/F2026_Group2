const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const { migrate } = require('../../src/db/migrate');
const { seed } = require('../../src/db/seed');

function newDatabase() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

test('the seed adds a user with workouts and a goal', () => {
  const db = newDatabase();
  seed(db);

  const users = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const workouts = db.prepare('SELECT COUNT(*) AS count FROM workouts').get().count;
  const goals = db.prepare('SELECT COUNT(*) AS count FROM goals').get().count;

  expect(users).toBe(1);
  expect(workouts).toBe(4);
  expect(goals).toBe(1);
});

test('the password is saved as a hash, not as the real password', () => {
  const db = newDatabase();
  seed(db);

  const user = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('demo@example.com');

  expect(user.password_hash).not.toBe('demo1234');
  expect(bcrypt.compareSync('demo1234', user.password_hash)).toBe(true);
});

test('running the seed twice does not add the data twice', () => {
  const db = newDatabase();
  seed(db);
  seed(db);

  const users = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  expect(users).toBe(1);
});
