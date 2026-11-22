// This file holds all the SQL about goals, plus each goal's status and progress (RQ11, RQ13, UC07).
// The routes (Marius's routes/goals.js) call these functions instead of writing SQL themselves.
// Every query filters by user_id, so a user only reaches their own goals (NFR03).
// Values always go in through ? placeholders, never glued into the SQL (no SQL injection).

// The app's shared database connection (connection.js).
const db = require('./connection');

// Function to monitor the progress of a user's goal.
// RQ13 (calculate and display goal progress based on stored workouts) + RQ11 (allow users to view the status of each goal).
function progressOf(goal) {
  // Add up this user's workouts in a total from the day the goal was set up to its target date.
  // One query gives all three totals at once: calories, minutes and number of workouts.
  // COALESCE(..., 0) turns "no workouts" (NULL) into 0.
  const totals = db
    .prepare(
      `SELECT COALESCE(SUM(calories_burned), 0) AS calories,
              COALESCE(SUM(duration), 0)        AS duration,
              COUNT(*)                          AS workouts
              FROM workouts WHERE user_id = ? AND workout_date >= ? AND workout_date <= ?`
    )
    .get(goal.user_id, goal.start_date || '0000-01-01', goal.target_date);

  // Pick the total that matches the goal type ('calories', 'duration' or 'workouts').
  // A goal type we don't know counts as 0 instead of crashing.
  const current = totals[goal.goal_type] || 0;

  // Today's date as text like '2026-11-15', the same format as target_date.
  const today = new Date().toISOString().slice(0, 10);

  // Reached the target = completed. Not reached and the date has passed = expired. Otherwise active.
  // Dates are 'YYYY-MM-DD' text, so comparing them as text puts them in date order.
  let status = 'active';
  if (current >= goal.target_value) status = 'completed';
  else if (goal.target_date < today) status = 'expired';

  return { current, status };
}

// Function to save a new goal for this user and return the goal_id SQLite gave it.
// userId comes from the login token, never from the form.
// status is left out: the table fills in 'active' by itself (DEFAULT 'active' in 001_schema.sql).
// start_date is today, so only workouts from now on count towards the goal (RQ13).
function createGoal(userId, goal) {
  const result = db
    .prepare('INSERT INTO goals (user_id, goal_type, target_value, target_date, start_date) VALUES (?, ?, ?, ?, ?)')
    .run(userId, goal.goalType, goal.targetValue, goal.targetDate, new Date().toISOString().slice(0, 10));
  return result.lastInsertRowid;
}

// Function to list goals for a user.
// RQ11 (allow users to view the status of each goal) each with today's status.
function listGoals(userId) {
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY target_date').all(userId);

  // For each goal, keep all its columns (...goal) and replace status with today's.
  return goals.map((goal) => ({ ...goal, status: progressOf(goal).status }));
}

// Function to let the user get a goal.
// One goal with today's status.
// "AND user_id = ?" means another user's goal comes back as undefined, the same as a goal that doesn't exist.
function getGoal(goalId, userId) {
  const goal = db.prepare('SELECT * FROM goals WHERE goal_id = ? AND user_id = ?').get(goalId, userId);
  if (!goal) return undefined;
  return { ...goal, status: progressOf(goal).status };
}

// Function to let the user change a goal.
// Returns 1 if it was changed, 0 if not found or not this user's (the route turns 0 into an error 404).
function updateGoal(goalId, userId, goal) {
  const result = db
    .prepare('UPDATE goals SET goal_type = ?, target_value = ?, target_date = ? WHERE goal_id = ? AND user_id = ?')
    .run(goal.goalType, goal.targetValue, goal.targetDate, goalId, userId);
  return result.changes;
}

// Function to let the user delete a goal
// Returns 1 if it was deleted, 0 if not found or not this user's (the route turns 0 into an error 404).
function deleteGoal(goalId, userId) {
  return db.prepare('DELETE FROM goals WHERE goal_id = ? AND user_id = ?').run(goalId, userId).changes;
}

// Function to let the user see the progress of their goal
// UC07: monitor progress of one goal, for the progress bar on the goals screen.
function getGoalProgress(goalId, userId) {
  // getGoal already checks the goal belongs to this user, so we don't repeat that check.
  const goal = getGoal(goalId, userId);
  if (!goal) return undefined;

  const { current, status } = progressOf(goal);

  // Percentage done, rounded, and never more than 100 even if the user did more than the target.
  const percent = Math.min(100, Math.round((current / goal.target_value) * 100));

  return { goalId: goal.goal_id, goalType: goal.goal_type, current, target: goal.target_value, percent, status };
}

// Export the six functions so app.js and Marius's backend/src/routes/goals.js can use them.
module.exports = { createGoal, listGoals, getGoal, updateGoal, deleteGoal, getGoalProgress };