// seed.js
// Puts demo data into the database, so the screens have something to show.
// Run it with:  npm run seed   (after npm run migrate)
//
// Demo logins:  demo@example.com / demo1234     admin@example.com / admin1234

const bcrypt = require('bcrypt');

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

  // 2. Four workouts for the demo user
  const addWorkout = db.prepare(
    'INSERT INTO workouts (user_id, workout_date, exercise_type, duration, calories_burned, equipment_used) VALUES (?, ?, ?, ?, ?, ?)'
  );
  addWorkout.run(userId, '2026-10-12', 'Running', 30, 300, null);
  addWorkout.run(userId, '2026-10-13', 'Weights', 45, 250, 'Dumbbells');
  addWorkout.run(userId, '2026-10-15', 'Cycling', 60, 500, 'Bike');
  addWorkout.run(userId, '2026-10-16', 'Yoga', 40, 150, 'Mat');

  // 3. One goal for the demo user
  db.prepare('INSERT INTO goals (user_id, goal_type, target_value, target_date) VALUES (?, ?, ?, ?)')
    .run(userId, 'Weight loss', 72, '2026-12-31');

  // 4. One template of each kind, made by the demo admin
  db.prepare('INSERT INTO exercise_templates (admin_id, template_name, category, description) VALUES (?, ?, ?, ?)')
    .run(adminId, 'Beginner full body', 'Strength', 'Three sessions a week, 30 minutes each.');
  db.prepare('INSERT INTO goal_templates (admin_id, template_name, goal_type, description) VALUES (?, ?, ?, ?)')
    .run(adminId, 'Lose 5 kg in 3 months', 'Weight loss', 'A steady, realistic weight loss goal.');

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
