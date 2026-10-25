// We load the two functions we are testing.
// "../../" = up from tests/auth/ to tests/, then up to backend/, then into src/.
const { hashPassword, checkPassword } = require('../../src/auth/password');

// Test 1: the hash is not the plain password.
test('hashPassword does not return the plain password', () => {
  const hash = hashPassword('demo1234');
  expect(hash).not.toBe('demo1234');
});

// Test 2: the hash is a real bcrypt hash made with our cost of 10.
// Test 1 only proves the password was changed somehow, test 2 proves it was changed the right way.
// "$2b$" = made by bcrypt, "10$" = SALT_ROUNDS is what we used.
// If someone lowers SALT_ROUNDS or swaps bcrypt for something weaker, this test fails.
test('hashPassword makes a bcrypt hash with cost 10', () => {
  const hash = hashPassword('demo1234');
  expect(hash.startsWith('$2b$10$')).toBe(true);
});

// Test 3: the same password gives a different hash every time, because bcrypt adds a new random salt.
// Without salt, two users with the same password would have the same hash, and an attacker could crack them both at once.
test('hashPassword gives a different hash each time for the same password', () => {
  const hash1 = hashPassword('demo1234');
  const hash2 = hashPassword('demo1234');
  expect(hash1).not.toBe(hash2);
});

// Test 4: the right password matches its hash.
// This is what makes login work for a real user.
test('checkPassword returns true for the right password', () => {
  const hash = hashPassword('demo1234');
  expect(checkPassword('demo1234', hash)).toBe(true);
});

// Test 5: a wrong password does not match its hash.
// If checkPassword always said true, Test 4 would still pass but anyone could log in. This test catches that.
test('checkPassword returns false for the wrong password', () => {
  const hash = hashPassword('demo1234');
  expect(checkPassword('wrongpass', hash)).toBe(false);
});