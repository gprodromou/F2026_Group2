# Online Fitness Tracking System
CSE410 Software Engineering II - Group 2 (F2026)

## Backend

Node.js + Express server with a SQLite database (better-sqlite3)

### Requirements
- Node.js 20 or newer (check with `node -v`)

### First-time setup (in terminal)
1. `git clone https://github.com/gprodromou/F2026_Group2.git`
2. `cd F2026_Group2/backend`
3. `npm install` (downloads the libraries listed in package.json)
4. Optional: copy `.env.example` to `.env` to change settings. The defaults work without it.

### Commands (run inside the backend folder in terminal)
- `npm run dev`: start the server, it restarts automatically when you save a file
- `npm start`: start the server normally
- `npm test`: run the automated tests

The server runs at http://localhost:3000. To check it is working, open http://localhost:3000/health, which should show `{"status":"ok","database":"connected"}`.

### Structure
- `src/server.js`: starts the server
- `src/app.js`: the Express app and its routes
- `src/config.js`: reads settings from .env
- `src/db/connection.js`: the shared SQLite connection
- `tests/`: automated tests (Jest + Supertest)