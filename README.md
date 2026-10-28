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
4. `cp .env.example .env`, then open .env and put your own random value in JWT_SECRET (the command to make one is in the file). Login does not work without it.
5. `npm run migrate` (creates the tables in fitness.db)
6. `npm run seed` (optional: adds demo data, login demo@example.com / demo1234)

### Commands (run inside the backend folder in terminal)
- `npm run dev`: start the server, it restarts automatically when you save a file
- `npm start`: start the server normally
- `npm test`: run the automated tests
-  `npm run migrate`: create or update the database tables
- `npm run seed`: add demo data to the database

The server runs at http://localhost:3000. To check it is working, open http://localhost:3000/health, which should show `{"status":"ok","database":"connected"}`.

### Structure
- `src/server.js`: starts the server
- `src/app.js`: the Express app and its routes
- `src/config.js`: reads settings from .env
- `src/db/connection.js`: the shared SQLite connection
-  `migrations/`: the SQL files that build the database 
- `src/db/migrate.js` and `src/db/seed.js`: run the migrations and add demo data
- `src/auth/password.js`: hashes passwords with bcrypt and checks them at login
- `src/auth/jwt.js`: makes and checks the login tokens (JWT)
- `src/middleware/errors.js`: sends errors back as JSON (404 and 500)
- `src/routes/auth.js` and `src/db/users.js`: register and login (Marius)
- `tests/`: automated tests (Jest + Supertest)