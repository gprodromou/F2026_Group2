-- 001_schema.sql
-- Creates the seven tables of the database.
-- PRIMARY KEY  = the unique number of each row
-- FOREIGN KEY  = a link to a row in another table

CREATE TABLE users (
  user_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  date_of_birth  TEXT,
  height         REAL,
  weight         REAL,
  role           TEXT NOT NULL DEFAULT 'user',
  account_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE admins (
  admin_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL
);

CREATE TABLE workouts (
  workout_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  workout_date    TEXT NOT NULL,
  exercise_type   TEXT NOT NULL,
  duration        INTEGER NOT NULL,
  calories_burned INTEGER,
  equipment_used  TEXT,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE goals (
  goal_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  goal_type     TEXT NOT NULL,
  target_value  REAL NOT NULL,
  target_date   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE progress_reports (
  report_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  start_date      TEXT NOT NULL,
  end_date        TEXT NOT NULL,
  total_workouts  INTEGER,
  total_duration  INTEGER,
  total_calories  INTEGER,
  summary         TEXT,
  recommendation  TEXT,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE exercise_templates (
  exercise_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id             INTEGER NOT NULL,
  template_name        TEXT NOT NULL,
  category             TEXT,
  description          TEXT,
  FOREIGN KEY (admin_id) REFERENCES admins (admin_id)
);

CREATE TABLE goal_templates (
  goal_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id         INTEGER NOT NULL,
  template_name    TEXT NOT NULL,
  goal_type        TEXT NOT NULL,
  description      TEXT,
  FOREIGN KEY (admin_id) REFERENCES admins (admin_id)
);
