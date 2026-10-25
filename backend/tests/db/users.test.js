// Tests for users.js

// Use a test database in memory (not the real fitness.db).
process.env.DB_FILE = ':memory:';

const db = require('../../src/db/connection');
const { migrate } = require('../../src/db/migrate');
const users = require('../../src/db/users');

// Make the tables.
migrate(db);

// Test 1: save a user, then find them.
test('save a user and find them by email', () => {
  users.createUser({ name: 'Anna', email: 'anna@example.com', passwordHash: 'abc' });

  const user = users.findUserByEmail('anna@example.com');

  expect(user.name).toBe('Anna');
});

// Test 2: an email that nobody has gives nothing back.
test('unknown email gives nothing', () => {
  const user = users.findUserByEmail('nobody@example.com');

  expect(user).toBeUndefined();
});