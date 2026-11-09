// All the SQL about the workouts table.
// The routes call these functions instead of writing SQL themselves.
// NFR03: The system shall prevent users from accessing other users' data.
// Every function here takes the userId, and every query filters by it, 
// so a user can only save and see their own workouts.

// The app's shared database connection (connection.js).
const db = require('./connection');

// Save a new workout for this user and return the workout_id SQLite gave it.
// userId comes from the login token (req.user.user_id), not from the form,
// so nobody can save a workout under someone else's account.
function createWorkout(userId, workout) {
  const result = db
    .prepare(
      'INSERT INTO workouts (user_id, workout_date, exercise_type, duration, calories_burned, equipment_used) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(userId, workout.workoutDate, workout.exerciseType, workout.duration, workout.caloriesBurned, workout.equipmentUsed);

  return result.lastInsertRowid;
}

// Return all the workouts of this user, newest first.
// "WHERE user_id = ?" is what keeps other users' workouts out.
// .all() returns a list. It is an empty list if the user has no workouts.
function listWorkouts(userId) {
  return db
    .prepare('SELECT * FROM workouts WHERE user_id = ? ORDER BY workout_date DESC')
    .all(userId);
}

// Share both functions, so the workout routes can use them.
module.exports = { createWorkout, listWorkouts };