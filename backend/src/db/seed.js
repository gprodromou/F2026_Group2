// seed.js
// Puts demo data into the database, so the screens have something to show (week 6 demo).
// Run it with:  npm run seed   (after npm run migrate)
//
// Demo logins:  demo@example.com / demo1234     admin@example.com / admin1234
//
// The workout dates are counted back from TODAY, so the demo always looks recent:
// the history screen, the charts and the goal progress all have data from the last few weeks.

const bcrypt = require('bcrypt');

// The date "days" days before today, as text like '2026-11-20'.
// daysAgo(0) = today, daysAgo(7) = one week ago, daysAgo(-10) = in 10 days.
function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function seed(db) {
  // If the demo user is already there, stop, so we never add the data twice.
  const existing = db.prepare('SELECT user_id FROM users WHERE email = ?').get('demo@example.com');
  if (existing) {
    return false;
  }

  // We never save the real password, only its bcrypt hash.
  const userPassword = bcrypt.hashSync('demo1234', 10);
  const adminPassword = bcrypt.hashSync('admin1234', 10);

  // 1. The demo user and the demo admin
  const user = db
    .prepare('INSERT INTO users (name, email, password_hash, date_of_birth, height, weight) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Demo User', 'demo@example.com', userPassword, '2000-05-14', 178, 76.5);
  const userId = user.lastInsertRowid; // the user_id SQLite just gave this user

  const admin = db
    .prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)')
    .run('Demo Admin', 'admin@example.com', adminPassword);
  const adminId = admin.lastInsertRowid;

  // 2. Ten workouts for the demo user over the last three weeks
  const addWorkout = db.prepare(
    'INSERT INTO workouts (user_id, workout_date, exercise_type, duration, calories_burned, equipment_used) VALUES (?, ?, ?, ?, ?, ?)'
  );
  addWorkout.run(userId, daysAgo(20), 'Running', 30, 300, null);
  addWorkout.run(userId, daysAgo(18), 'Weights', 45, 250, 'Dumbbells');
  addWorkout.run(userId, daysAgo(16), 'Cycling', 60, 500, 'Bike');
  addWorkout.run(userId, daysAgo(13), 'Yoga', 40, 150, 'Mat');
  addWorkout.run(userId, daysAgo(11), 'Running', 35, 350, null);
  addWorkout.run(userId, daysAgo(9), 'Swimming', 45, 400, null);
  addWorkout.run(userId, daysAgo(6), 'Weights', 50, 280, 'Dumbbells');
  addWorkout.run(userId, daysAgo(4), 'Cycling', 50, 420, 'Bike');
  addWorkout.run(userId, daysAgo(2), 'Running', 25, 260, null);
  addWorkout.run(userId, daysAgo(1), 'Yoga', 30, 120, 'Mat');

  // 3. Three goals, one for each status (RQ11), so the goals screen shows all of them.
  const addGoal = db.prepare(
    'INSERT INTO goals (user_id, goal_type, target_value, target_date, start_date) VALUES (?, ?, ?, ?, ?)'
  );
  // Active: 5000 calories in the next month. The last three weeks give 3030, so about 61%.
  addGoal.run(userId, 'calories', 5000, daysAgo(-30), daysAgo(21));
  // Completed: 5 workouts in two weeks. The last two weeks have 7 workouts.
  addGoal.run(userId, 'workouts', 5, daysAgo(-7), daysAgo(14));
  // Expired: 1000 minutes between 2 months ago and 1 month ago, with no workouts then.
  addGoal.run(userId, 'duration', 1000, daysAgo(30), daysAgo(60));

  // 4. One template of each kind, made by the demo admin
  db.prepare('INSERT INTO exercise_templates (admin_id, template_name, category, description) VALUES (?, ?, ?, ?)')
    .run(adminId, 'Beginner full body', 'Strength', 'Three sessions a week, 30 minutes each.');
  db.prepare('INSERT INTO goal_templates (admin_id, template_name, goal_type, description) VALUES (?, ?, ?, ?)')
    .run(adminId, 'Burn 5000 calories in a month', 'calories', 'A steady, realistic goal for a beginner.');

  return true;
}

// This part runs only when you type "npm run seed".
if (require.main === module) {
  // Use the app's shared database connection (Georgios's connection.js).
  const db = require('./connection');

  if (seed(db)) {
    console.log('Demo data added.');
  } else {
    console.log('Demo data is already there.');
  }

  db.close();
}

module.exports = { seed };
