// goals.js: the routes for the user's fitness goals.
//   POST   /goals               create a goal       -> 201 (or 400 if something is wrong)
//   GET    /goals               list my goals       -> 200 (each goal has its status: active, completed or expired)
//   GET    /goals/:id           see one goal        -> 200 (or 404)
//   PUT    /goals/:id           edit a goal         -> 200 (or 400 / 404)
//   DELETE /goals/:id           delete a goal       -> 200 (or 404)
//   GET    /goals/:id/progress  how close am I?     -> 200 (or 404)
// A goal has 3 things:
//   goalType    = what we count: 'calories', 'duration' (minutes) or 'workouts' (how many)
//   targetValue = the number to reach, for example 1000 (calories)
//   targetDate  = the last day, for example 2026-12-31
// Only logged-in users get here, so req.user.user_id is the logged-in user.
// A user can only see and change THEIR OWN goals.
// No SQL here: the SQL and the progress math are in db/goals.js (Georgios).

const express = require('express');
const goals = require('../db/goals');

const router = express.Router();

// The 3 kinds of goals we support.
const GOAL_TYPES = ['calories', 'duration', 'workouts'];

// Check the goal the user sent. Gives back an error message, or null if it is fine.
function checkGoal(body) {
  if (!GOAL_TYPES.includes(body.goalType)) {
    return 'Goal type must be calories, duration or workouts';
  }
  if (!(body.targetValue > 0)) {
    return 'Target value must be more than 0';
  }
  if (!body.targetDate) {
    return 'Target date is required';
  }
  return null;
}

// Make a goal from the data the user sent.
function makeGoal(body) {
  return {
    goalType: body.goalType,
    targetValue: body.targetValue,
    targetDate: body.targetDate,
  };
}

// ---------- CREATE ----------
router.post('/', (req, res) => {
  const body = req.body || {};

  const error = checkGoal(body);
  if (error) {
    return res.status(400).json({ error: error });
  }

  const goalId = goals.createGoal(req.user.user_id, makeGoal(body));
  res.status(201).json({ goalId: Number(goalId) });
});

// ---------- LIST ----------
router.get('/', (req, res) => {
  res.status(200).json(goals.listGoals(req.user.user_id));
});

// ---------- PROGRESS ----------
router.get('/:id/progress', (req, res) => {
  const progress = goals.getGoalProgress(Number(req.params.id), req.user.user_id);

  // Not found (or it is someone else's goal).
  if (!progress) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  res.status(200).json(progress);
});

// ---------- SEE ONE ----------
router.get('/:id', (req, res) => {
  const goal = goals.getGoal(Number(req.params.id), req.user.user_id);

  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  res.status(200).json(goal);
});

// ---------- EDIT ----------
router.put('/:id', (req, res) => {
  const body = req.body || {};

  const error = checkGoal(body);
  if (error) {
    return res.status(400).json({ error: error });
  }

  const changed = goals.updateGoal(Number(req.params.id), req.user.user_id, makeGoal(body));
  if (changed === 0) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  res.status(200).json({ updated: true });
});

// ---------- DELETE ----------
router.delete('/:id', (req, res) => {
  const deleted = goals.deleteGoal(Number(req.params.id), req.user.user_id);
  if (deleted === 0) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  res.status(200).json({ deleted: true });
});

module.exports = router;