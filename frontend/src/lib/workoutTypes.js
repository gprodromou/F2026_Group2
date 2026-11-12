// workoutTypes.js: the workout types, in ONE place.
// The entry form (pages/WorkoutNew.jsx) offers them, and the history screen gives the same
// names to the filter bar (<FilterBar types={WORKOUT_TYPE_NAMES} />), so a workout saved
// with a type is found again when the user filters by it.
// "Other" is not in the filter list: the user types their own text for it.

export const OTHER = 'Other';

// The icon is only decoration (aria-hidden) in the entry form.
export const TYPE_OPTIONS = [
  { value: 'Cardiovascular', icon: '🏃' },
  { value: 'Strength & Resistance', icon: '💪' },
  { value: 'HIIT', icon: '⚡' },
  { value: 'Flexibility & Mobility', icon: '🧘' },
  { value: 'Balance & Stability', icon: '⚖️' },
  { value: 'Functional Training', icon: '🏋️' },
  { value: OTHER, icon: '✏️' },
];

// Just the names, without "Other": what the filter dropdown shows.
export const WORKOUT_TYPE_NAMES = TYPE_OPTIONS.filter((t) => t.value !== OTHER).map((t) => t.value);
