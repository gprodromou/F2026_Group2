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

// Find one user by their id. Returns the user, or undefined if nobody has that id.
function findUserById(userId) {
  // SELECT = read. "?" is replaced by userId.
  return db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
}

// saveTotpSecret: save the user's secret key in the database.
// The phone app uses this same key to make the 6-digit codes.
// 2FA is still OFF after this. It turns on only when the user types a correct code.
function saveTotpSecret(userId, secret) {
  // UPDATE = change a user who already exists.
  // The first "?" becomes secret, the second "?" becomes userId.
  db.prepare('UPDATE users SET totp_secret = ? WHERE user_id = ?').run(secret, userId);
}

// Switch 2FA on for the user (0 = off, 1 = on).
// From now on, this user needs a code from their phone to log in.
function turnOnTwoFactor(userId) {
  db.prepare('UPDATE users SET totp_enabled = 1 WHERE user_id = ?').run(userId);
}
// Share all the functions, so the routes can use them.
module.exports = { findUserByEmail, createUser, findUserById, saveTotpSecret, turnOnTwoFactor };