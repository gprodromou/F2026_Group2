// auth.js: this file lets a user create an account and log in.
// Register (POST /auth/register):
//   - account created            -> answer 201 (Created)
//   - name, email or password missing -> answer 400 (Bad request)
//   - email is already used      -> answer 409 (Conflict)
// Login (POST /auth/login):
//   - email and password correct -> answer 200 (OK) and a token
//   - email or password wrong    -> answer 401 (Not allowed)
// This file has no SQL. All the database code is in db/users.js.

const express = require('express');
const users = require('../db/users');
const password = require('../auth/password');
const jwt = require('../auth/jwt');

const router = express.Router();

// ---------- REGISTER ----------
router.post('/register', async (req, res) => {
  // The data the frontend sent (as JSON).
  const body = req.body || {};

  // 1. Name, email and password must be filled in.
  if (!body.name || !body.email || !body.password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  // 2. The email must not be used already (RQ02).
  const existingUser = users.findUserByEmail(body.email);
  if (existingUser) {
    return res.status(409).json({ error: 'This email is already registered' });
  }

  // 3. Hash the password. We never save the real password (NFR01).
  const passwordHash = await password.hashPassword(body.password);

  // 4. Save the new user in the database.
  const userId = users.createUser({
    name: body.name,
    email: body.email,
    passwordHash: passwordHash,
    dateOfBirth: body.dateOfBirth,
    height: body.height,
    weight: body.weight,
  });

  // 5. Answer 201 ("created") with the new user's id.
  res.status(201).json({ userId: userId });
});

//  LOGIN Function
router.post('/login', async (req, res) => {
  const body = req.body || {};

  // 1. Email and password must be filled in.
  if (!body.email || !body.password) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  // 2. Find the user with this email.
  const user = users.findUserByEmail(body.email);
  if (!user) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  // 3. Check the password against the saved hash.
  const correct = await password.checkPassword(body.password, user.password_hash);
  if (!correct) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  // 4. Everything is correct: give back a token.
  const token = jwt.createToken(user);
  res.status(200).json({ token: token });
});

module.exports = router;