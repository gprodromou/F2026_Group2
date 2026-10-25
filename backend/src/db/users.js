// users.js: all the SQL about the users table.
// The routes call these functions instead of writing SQL themselves.

// The app's shared database connection (Georgios's connection.js).
const db = require('./connection');

// Find one user by email. Returns the user, or undefined if nobody has that email.
function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

// Save a new user and return the user_id SQLite gave them.
// The password must already be hashed: this file never sees the real password.
function createUser(user) {
  const result = db
    .prepare(
      'INSERT INTO users (name, email, password_hash, date_of_birth, height, weight) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(user.name, user.email, user.passwordHash, user.dateOfBirth, user.height, user.weight);

  return result.lastInsertRowid;
}

module.exports = { findUserByEmail, createUser };