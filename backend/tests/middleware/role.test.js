// role.test.js: this file proves the role guard works (NFR02: role-based access, User vs Admin).
// tests/setup.js gives these tests their own secret ('test-secret').

// express to build a small practice app, and supertest to send it fake requests.
const express = require('express');
const request = require('supertest');
// createToken from src/auth/jwt.js, to make real tokens for a user and an admin.
const { createToken } = require('../../src/auth/jwt');
// The two guards: requireAuth reads the token, requireRole checks the role.
const { requireAuth } = require('../../src/middleware/auth');
const { requireRole } = require('../../src/middleware/role');

// app.js has no admin routes yet,
// so this test builds its own mini app with one admin-only route,
// protected by requireAuth and then requireRole('admin').
const testApp = express();
testApp.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ ok: true });
});

// Group the tests for the role guard under one name.
describe('requireRole on an admin-only route', () => {
  // Test 1: a normal user means error 403.
  test('a normal user gets 403', async () => {
    // Make a real token for a normal user.
    const token = createToken({ user_id: 1, role: 'user' });
    // Send a request to the admin route with the user's token.
    const res = await request(testApp).get('/admin-only').set('Authorization', `Bearer ${token}`);
    // The guard must refuse it with an error 403.
    expect(res.status).toBe(403);
  });

  // Test 2: an admin token means 200 (allowed in).
  test('an admin gets 200', async () => {
    // Make a real token for an admin.
    const token = createToken({ user_id: 2, role: 'admin' });
    // Send a request to the admin route with the admin's token.
    const res = await request(testApp).get('/admin-only').set('Authorization', `Bearer ${token}`);
    // The guard must let it through.
    expect(res.status).toBe(200);
  });
});