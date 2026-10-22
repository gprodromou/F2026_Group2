// config.js: all the app's settings are here.

// This is the ONLY file that reads the .env file. Every other file asks config for its settings instead of reading .env directly. 
// That way, if a setting changes name or a new one is added, we only have to edit this file.

// dotenv is a library that reads the .env file and puts each line into process.env, Node's built-in list of settings.
// After this line, the code can read PORT=3000 from .env as process.env.PORT (the PORT setting the program was given).
// { quiet: true } stops dotenv printing its "injected env" message every time it runs.
require('dotenv').config({ quiet: true });

module.exports = {
  // The port the server listens on.
  // "||" means "or, if that is missing": use the PORT from .env, or 3000 if there is no .env file or no PORT line in it.
  // This lets a teammate run the project straight after cloning, even before creating their own .env.
  port: process.env.PORT || 3000,

  // The SQLite database file name. Same idea here as well, use DB_FILE from .env, or fitness.db if it is not set there.
  dbFile: process.env.DB_FILE || 'fitness.db',
};