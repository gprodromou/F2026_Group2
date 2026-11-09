// workouts.js: the routes for the user's workouts.
//   POST   /workouts      add a workout     -> 201 (or 400 if something is missing)
//   GET    /workouts      list my workouts  -> 200 (can filter: ?from=2026-11-01&to=2026-11-30)
//   GET    /workouts/:id  see one workout   -> 200 (or 404)
//   PUT    /workouts/:id  edit a workout    -> 200 (or 400 / 404)
//   DELETE /workouts/:id  delete a workout  -> 200 (or 404)
// Only logged-in users get here, so req.user.user_id is the logged-in user.
// A user can only see and change THEIR OWN workouts.
// No SQL here: the SQL is in db/workouts.js.

const express = require('express');
const workouts = require('../db/workouts');

const router = express.Router();

// Make a workout from the data the user sent.
// Calories and equipment are optional, so if they are missing they become null (empty).
function makeWorkout(body) {
  return {
    workoutDate: body.workoutDate,
    exerciseType: body.exerciseType,
    duration: body.duration,
    caloriesBurned: body.caloriesBurned || null,
    equipmentUsed: body.equipmentUsed || null,
  };
}

// ---------- ADD ----------
router.post('/', (req, res) => {
  const body = req.body || {};

  // Date, type and duration must be there.
  if (!body.workoutDate || !body.exerciseType || !body.duration) {
    return res.status(400).json({ error: 'Date, exercise type and duration are required' });
  }

  // Save it and send back the new id.
  const workoutId = workouts.createWorkout(req.user.user_id, makeWorkout(body));
  res.status(201).json({ workoutId: Number(workoutId) });
});

// ---------- LIST ----------
router.get('/', (req, res) => {
  // All my workouts.
  let list = workouts.listWorkouts(req.user.user_id);

  // If "from" is given, keep only workouts on or after that date.
  if (req.query.from) {
    list = list.filter((workout) => workout.workout_date >= req.query.from);
  }

  // If "to" is given, keep only workouts on or before that date.
  if (req.query.to) {
    list = list.filter((workout) => workout.workout_date <= req.query.to);
  }

  res.status(200).json(list);
});

// ---------- SEE ONE ----------
router.get('/:id', (req, res) => {
  const workout = workouts.getWorkout(Number(req.params.id), req.user.user_id);

  // Not found (or it is someone else's workout).
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  res.status(200).json(workout);
});

// ---------- EDIT ----------
router.put('/:id', (req, res) => {
  const body = req.body || {};

  if (!body.workoutDate || !body.exerciseType || !body.duration) {
    return res.status(400).json({ error: 'Date, exercise type and duration are required' });
  }

  const changed = workouts.updateWorkout(Number(req.params.id), req.user.user_id, makeWorkout(body));

  // 0 = not found (or someone else's workout).
  if (changed === 0) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  res.status(200).json({ updated: true });
});

// ---------- DELETE ----------
router.delete('/:id', (req, res) => {
  const deleted = workouts.deleteWorkout(Number(req.params.id), req.user.user_id);

  // 0 = not found (or someone else's workout).
  if (deleted === 0) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  res.status(200).json({ deleted: true });
});

module.exports = router;