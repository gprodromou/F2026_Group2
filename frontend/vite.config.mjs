// vite.config.mjs: settings for Vite, the tool behind `npm run dev` (Bogdan C, week 5).
//
// Vite shows the React website at http://localhost:5173. The data comes from the Express
// backend at http://localhost:3000, so Vite passes ("proxies") every API call on to it:
//
//   browser  ->  Vite (5173)  ->  Express (3000)  ->  SQLite
//
// The website calls the API with short addresses such as fetch('/workouts'). Thanks to the
// proxy the browser only ever talks to one address (5173), so there are no CORS problems
// and nothing in the backend has to change.
//
// The tricky part: some pages and API routes start the same way. The page /workouts/new
// (Yanna's form) and the API GET /workouts/:id both start with /workouts, and soon /goals
// will be both a page and an API route. So Vite looks at what the browser asks for:
//   - opening or reloading a page, the browser asks for text/html -> send the website
//   - a fetch() from our code asks for JSON (or anything else)    -> send it to Express

import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:3000'; // the PORT in backend/.env

// The first part of every API address mounted in backend/src/app.js.
// stats, reports, users and share are added now for the routes planned in weeks 6 and 8;
// a prefix the backend does not have yet just answers with its JSON 404.
const API_PREFIXES = [
  'health', 'auth', 'me', 'workouts', 'goals', 'admin', // on main now
  'stats', 'reports', 'users', 'share',                 // planned (weeks 6 and 8)
];

// Matches "/workouts", "/workouts/7" and "/workouts?from=..." but not "/workoutsXYZ".
const API_PATH = `^/(${API_PREFIXES.join('|')})(/|\\?|$)`;

// A page request gets the website instead of being sent to Express.
function servePagesToTheBrowser(req) {
  const accept = req.headers.accept || '';
  if (req.method === 'GET' && accept.includes('text/html')) {
    return '/index.html';
  }
  return undefined; // undefined = go on to Express
}

export default {
  plugins: [react()], // lets Vite understand JSX and reload the page when a file changes
  server: {
    port: 5173,
    proxy: {
      [API_PATH]: {
        target: BACKEND,
        changeOrigin: true,
        bypass: servePagesToTheBrowser,
      },
    },
  },
};
