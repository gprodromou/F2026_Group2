// migrate.js
// Runs the .sql files in the "migrations" folder, in order (001, 002, ...).
// Run it with:  npm run migrate

const fs = require('fs');
const path = require('path');

const migrationsFolder = path.join(__dirname, '..', '..', 'migrations');

function migrate(db) {
  // A small table that remembers which files we already ran,
  // so running "npm run migrate" twice does not create the tables twice.
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY)');

  // All the .sql files, sorted by name: 001 comes before 002.
  const files = fs.readdirSync(migrationsFolder).filter((file) => file.endsWith('.sql')).sort();

  const applied = [];

  for (const file of files) {
    const alreadyDone = db.prepare('SELECT filename FROM schema_migrations WHERE filename = ?').get(file);

    if (alreadyDone) {
      continue; // skip it, it already ran before
    }

    const sql = fs.readFileSync(path.join(migrationsFolder, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
    applied.push(file);
  }

  return applied;
}

// This part runs only when you type "npm run migrate",
// not when a test file uses the migrate function.
if (require.main === module) {
  // Use the app's shared database connection (Georgios's connection.js).
  // It opens the file named in .env (DB_FILE) and already switches foreign keys on.
  const db = require('./connection');

  const applied = migrate(db);

  if (applied.length === 0) {
    console.log('Database is already up to date.');
  } else {
    console.log('Applied: ' + applied.join(', '));
  }

  db.close();
}

module.exports = { migrate };
