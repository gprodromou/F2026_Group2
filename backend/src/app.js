// app.js: creates the Express app and defines its routes.

// This file does NOT start the server (server.js does that).
// Keeping them separate lets the tests use the app without opening a real port.

// Each "const x = require(...)" line loads another file or library and stores what it exports under a name we can use in this file.
// "const" = constant means the name can't be changed to something else later, which protects us from overwriting it by mistake.

// Load the Express library (from node_modules), which handles web requests.
const express = require('express');

// Load our shared database connection from db/connection.js.
// "./" means "start from this file's folder" (src/).
const db = require('./db/connection');

// Calling express() creates our app. Routes are attached to this object.
const app = express();

// Lets routes read JSON sent by the frontend (for example a new workout from a form).
// Without this line, the data the frontend sends would arrive empty.
// Nothing uses it yet, but routes that receive data from the frontend (like saving a new workout) will need it.
app.use(express.json());

// Health check: a quick way to see if the backend is alive.
// Visit http://localhost:3000/health in the browser.
app.get('/health', (req, res) => {
  // "try" means: attempt this, and if anything fails,
  // jump to "catch" instead of crashing the server.
  try {
    // Ask SQLite the simplest possible question to prove it answers.
    db.prepare('SELECT 1').get();

    // Everything worked: send back status 200 (success) and JSON.
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    // The database didn't answer: send back status 500 and message "unreachable"
    res.status(500).json({ status: 'error', database: 'unreachable' });
  }
});

// With this command we share the app with the rest of the project.
// Two files get it with: const app = require('./app');
//   - server.js, which starts it listening on a port (npm start / npm run dev)
//   - tests/app.test.js, which sends it fake requests without starting it (npm test)
// This file only DEFINES the app, it never starts it. That is why the tests can check every route without opening a real port.
module.exports = app;