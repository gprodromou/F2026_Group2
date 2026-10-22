// connection.js: opens the SQLite database once and shares it.

// The whole app uses this ONE connection. Routes require this file to get "db" instead of opening the database again themselves,
// which would be slower and could cause conflicts.

// better-sqlite3 is the library that lets Node talk to SQLite.
const Database = require('better-sqlite3');

// Our settings (the database file name comes from .env, via config).
const config = require('../config');

// Open the database file. If the file doesn't exist yet, SQLite creates it automatically. 
// The file is created in the folder you run npm from, which is the backend/ folder.
const db = new Database(config.dbFile);

// SQLite does NOT check links between tables (foreign keys) unless we turn it on (as we mentioned in our presentation as well). 
// We turn it on so the database rejects data that points to something missing, e.g. a workout for a user who doesn't exist.
db.pragma('foreign_keys = ON');

// With this command we share the open connection with the rest of the app.
// Any file can now get it with: const db = require('./db/connection');
// Node runs this file only the first time it is required and then remembers the result, so every file that requires it gets the SAME connection. 
// That is how the whole app shares ONE database connection.
module.exports = db;