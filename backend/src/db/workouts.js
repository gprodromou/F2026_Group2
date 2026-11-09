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

// ---------- Week 4 (Marius) ----------

// Get ONE workout. Only works if it is this user's workout.
function getWorkout(workoutId, userId) {
  return db.prepare('SELECT * FROM workouts WHERE workout_id = ? AND user_id = ?').get(workoutId, userId);
}

// Edit a workout. Gives back 1 if it worked, 0 if not found.
function updateWorkout(workoutId, userId, workout) {
  const result = db
    .prepare(
      'UPDATE workouts SET workout_date = ?, exercise_type = ?, duration = ?, calories_burned = ?, equipment_used = ? WHERE workout_id = ? AND user_id = ?'
    )
    .run(workout.workoutDate, workout.exerciseType, workout.duration, workout.caloriesBurned, workout.equipmentUsed, workoutId, userId);
  return result.changes;
}

// Delete a workout. Gives back 1 if it worked, 0 if not found.
function deleteWorkout(workoutId, userId) {
  const result = db.prepare('DELETE FROM workouts WHERE workout_id = ? AND user_id = ?').run(workoutId, userId);
  return result.changes;
}

// Share all the functions with the routes.
module.exports = { createWorkout, listWorkouts, getWorkout, updateWorkout, deleteWorkout };