// admins.js: all the SQL about the admins table.
// Admins are saved in their own table (admins), not in users (see 001_schema.sql).

// The app's shared database connection.
const db = require('./connection');

// Find one admin by email. Returns the admin, or undefined if no admin has that email.
function findAdminByEmail(email) {
  return db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
}

module.exports = { findAdminByEmail };