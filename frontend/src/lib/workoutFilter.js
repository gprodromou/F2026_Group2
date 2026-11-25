// workoutFilter.js: the filter that FilterBar reports, and the helpers that use it (RQ07).
//
// A filter is always this shape. An empty string means "not chosen":
//   { from: '2026-11-01', to: '2026-11-30', type: 'Cardiovascular' }
// Dates are 'YYYY-MM-DD', the same format as the workout_date column in the database,
// so they can be compared as plain text.

import { WORKOUT_TYPE_NAMES, splitTypes } from './workoutTypes';

export const NO_FILTER = Object.freeze({ from: '', to: '', type: '' });

// The workout types the dropdown offers by default: the SAME list as the workout entry form
// (Yanna's lib/workoutTypes.js), so there is only one list to keep up to date. (week 5)
export const WORKOUT_TYPES = WORKOUT_TYPE_NAMES;

// true when nothing is chosen.
export function isEmptyFilter(filter) {
  return !filter || (!filter.from && !filter.to && !filter.type);
}

// The error to show when the range is impossible, or null when it is fine.
export function checkRange(filter) {
  if (filter.from && filter.to && filter.from > filter.to) {
    return 'The start date must be on or before the end date';
  }
  return null;
}

// The query string for Marius's GET /workouts, which filters by date on the server:
//   { from: '2026-11-01', to: '' } -> '?from=2026-11-01'
// The type is not sent: the endpoint does not filter by type, so applyFilter does that.
export function filterToQuery(filter) {
  const params = new URLSearchParams();
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Keeps only the workouts that match the filter. Works on the rows the API returns
// ({ workout_date, exercise_type, ... }). The type is compared without caring about
// capital letters, so 'running' typed in the entry form still matches 'Running'.
// A workout saved with several types ("HIIT, Strength & Resistance") matches each of them.
export function applyFilter(workouts, filter) {
  if (isEmptyFilter(filter)) return workouts;
  const type = filter.type.toLowerCase();
  return workouts.filter((workout) => {
    if (filter.from && workout.workout_date < filter.from) return false;
    if (filter.to && workout.workout_date > filter.to) return false;
    if (type && !splitTypes(workout.exercise_type).some((t) => t.toLowerCase() === type)) return false;
    return true;
  });
}
