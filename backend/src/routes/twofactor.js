// twofactor.js: the routes for 2FA (login with a code from your phone, UC14).
// SETUP  (POST /auth/2fa/setup):  makes a secret key for the user -> answer 200 + the key
// ENABLE (POST /auth/2fa/enable): checks the 6-digit code from the phone app
// if the code its right -> answer 200 (2FA is now on)
// if the code its code wrong -> answer 400
// Both routes need the user to be logged in (requireAuth checks the token).
// This file has no SQL: the SQL is in db/users.js.

const express = require('express');

// otplib: the library that makes and checks the 6-digit codes.
const { authenticator } = require('otplib');

const users = require('../db/users');

// Georgios's login guard: only lets the request in if it has a real token.
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- SETUP ----------
// requireAuth runs first. If the token is fine, it puts the user's id in req.user.
router.post('/setup', requireAuth, (req, res) => {
  // 1. Find the logged-in user.
  const user = users.findUserById(req.user.user_id);

  // 2. Make a new random secret key and save it in the database.
  const secret = authenticator.generateSecret();
  users.saveTotpSecret(user.user_id, secret);

  // 3. Make the link that phone apps understand.
  //    The website can show it as a QR code to scan.
  const otpauthUrl = authenticator.keyuri(user.email, 'Fit4You', secret);

  // 4. Send back the key (to type in the app) and the link (for the QR code).
  res.status(200).json({ secret: secret, otpauthUrl: otpauthUrl });
});

//  ENABLE
router.post('/enable', requireAuth, (req, res) => {
  // The data the user sent, for example { "code": "482913" }.
  const body = req.body || {};

  // 1. Find the logged-in user.
  const user = users.findUserById(req.user.user_id);

  // 2. The user must do SETUP first, so they have a secret key.
  if (!user.totp_secret) {
    return res.status(400).json({ error: 'Set up 2FA first' });
  }

  // 3. Check the code from the phone against the saved key.
  //    String(...) turns the code into text, because otplib needs text.
  //    "|| ''" means: if no code was sent, use empty text (which is always wrong).
  const correct = authenticator.check(String(body.code || ''), user.totp_secret);
  if (!correct) {
    return res.status(400).json({ error: 'Wrong 2FA code' });
  }

  // 4. The code is right, so switch 2FA on.
  users.turnOnTwoFactor(user.user_id);
  res.status(200).json({ message: '2FA is now on' });
});

module.exports = router;