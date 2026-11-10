// client.js: the ONE way the frontend talks to the backend (NFR03).
// Pages call this instead of calling fetch themselves, so every request is made the same way:
//   1. the login token is attached:  Authorization: Bearer <token>
//   2. a body is sent as JSON
//   3. the answer is read as JSON
//   4. an error answer becomes an ApiError with the server's message
//   5. if the server answers 401 to a request that carried a token, the token is no longer
//      valid (expired or changed), so the user is signed out and sent to the login page.
//
// In a page, use the hook:
//
//   const api = useApi();
//   const list = await api.get('/workouts?from=2026-11-01');
//   await api.post('/workouts', { workoutDate, exerciseType, duration });
//
// The token comes from lib/token.js, the same place AuthContext saves it with signIn().
// It is read at the moment of each request, so a new login is used at once.

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../lib/token';
import { useAuth } from '../state/AuthContext';

export const LOGIN_PATH = '/login';
export const NETWORK_ERROR = 'We cannot reach the server. Check your connection and try again.';
export const GENERIC_ERROR = 'Something went wrong. Try again.';

// The error every failed request throws. status is the HTTP status, or 0 when the server
// could not be reached at all. message is what the user should see.
export class ApiError extends Error {
  constructor(status, message, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Sends one request. Works without React, so it can be tested on its own.
//   path            for example '/workouts' (the backend's routes)
//   method          'GET', 'POST', 'PUT' or 'DELETE'
//   body            any object; sent as JSON
//   onUnauthorized  called when a request WITH a token gets 401
// Returns the JSON answer, or throws an ApiError.
export async function apiRequest(path, { method = 'GET', body, onUnauthorized } = {}) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR); // no answer at all: server down or no internet
  }

  // Every backend answer is JSON (errors.js makes sure of that), but an empty body is fine too.
  const data = await response.json().catch(() => ({}));

  // 401 only means "log in again" when we SENT a token. Without one (for example a wrong
  // password on the login screen) the page itself shows the error.
  if (response.status === 401 && token && onUnauthorized) {
    onUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(response.status, data.error || GENERIC_ERROR, data);
  }

  return data;
}

// The hook pages use. It connects apiRequest to the app:
// on a 401 it calls signOut() from AuthContext and goes to the login page.
export function useApi() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return useMemo(() => {
    const onUnauthorized = () => {
      signOut(); // forget the token everywhere, so the navigation shows signed out
      navigate(LOGIN_PATH, { replace: true });
    };
    const send = (method) => (path, body) => apiRequest(path, { method, body, onUnauthorized });

    return {
      get: send('GET'),
      post: send('POST'),
      put: send('PUT'),
      del: send('DELETE'),
    };
  }, [signOut, navigate]);
}
