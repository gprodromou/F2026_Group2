// This file checks that login tokens can't be faked.
// tests/setup.js gives these tests their own secret ('test-secret'), so they never use the real one from .env.

// We load our two functions from jwt.js.
const { createToken, verifyToken } = require('../../src/auth/jwt');

// A pretend fake user with only the two fields that a token needs.
const user = { user_id: 5, role: 'user' };

// Test 1: if someone changes a token, it is refused.
// The signature at the end of a token only matches the exact text it was made for.
// So changing even one letter breaks it, and verifyToken must refuse it.
test('a changed token is refused', () => {
  // Make a real token for our fake user.
  const token = createToken(user);

  // Take the token without its last letter.
  const withoutLastLetter = token.slice(0, -1);

  // Put a different last letter back: 'b' if it was 'a', otherwise 'a'.
  // We check first, because if the last letter was already 'a', adding 'a' would change nothing.
  let changed;
  if (token.endsWith('a')) {
    changed = withoutLastLetter + 'b';
  } else {
    changed = withoutLastLetter + 'a';
  }
  
  // toThrow() (comes from Jest). It checks that the code throws an error.
  // A fake token makes verifyToken throw an error instead of returning a payload, so here an error means the test passes.
  // "() =>" wraps the call in a function, so Jest runs it itself and can catch the error.
  // Without it, the error would happen first and crash the test.
  expect(() => verifyToken(changed)).toThrow();
});

// Test 2: a token signed with a different secret is refused.
// This is what an attacker would try: making their own "admin" token without knowing our secret.
test('a token made with another secret is refused', () => {
  // Use the jsonwebtoken library directly, like an attacker would.
  const jwt = require('jsonwebtoken');

  // A fake token that says "I am an admin", signed with the wrong secret.
  const fake = jwt.sign({ user_id: 5, role: 'admin' }, 'some-other-secret');

  // so our verifyToken must refuse it, because it was not signed with our secret.
  expect(() => verifyToken(fake)).toThrow();
});