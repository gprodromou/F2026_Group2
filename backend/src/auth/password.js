// We load the bcrypt library that does the actual hashing for us.
// We have it at the top so every function in this file can use it.
const bcrypt = require('bcrypt');

// The cost: bcrypt scrambles the password 2^10 = 1024 times in a row for every hash.
// That makes each hash slow on purpose (~64 ms): fine for one login, but very slow for an attacker who has to try millions of guesses.
// It is 10 to match seed.js, and it lives in a constant so we change it in one place only.
const SALT_ROUNDS = 10;

// This function turns a plain-text password into a bcrypt hash (salt included) that is safe to store.
// bcrypt adds a random salt, so two users with the same password get different hashes.
// We will need this function before registering and saving a new user.
function hashPassword(password) {
  // We use the Sync version --> the server waits for the hash before moving on.
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

// This function checks the password that is given by the user and compares it with the hashed one
// If it is the same it gives back true 
// If it is not the same it gives back false 
function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// Share both functions with the rest of the app.
// Our authentication uses hashPassword on register and checkPassword on login.
// Our tests load them the same way.
module.exports = { hashPassword, checkPassword };