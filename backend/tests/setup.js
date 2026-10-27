// This file gives the tests their own separate settings, so they never use the real database or the real secret.
// Jest runs this file before every test file (see "setupFiles" in package.json).
// It runs BEFORE config.js reads .env, so these two test values win over whatever is in your .env.

// Tests use a temporary database that lives only in memory (':memory:' is a special SQLite name).
// It starts empty, disappears when the tests finish, and never touches the real fitness.db.
// So running npm test never adds fake users to your real database.
process.env.DB_FILE = ':memory:';

// Tests also get their own JWT secret, so they work on any computer, even one without a .env file
// For example a teammate who just cloned the project, or GitHub running the tests later.
// It's fine that this one is public: it's only used in tests, never by the real server.
process.env.JWT_SECRET = 'test-secret';