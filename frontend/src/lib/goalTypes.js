// goalTypes.js: the three goal types, in ONE place (Bogdan C, week 5).
// RQ13 (reworded 15 Nov): progress comes from the user's workouts, so a goal is one of
//   'calories'  total calories burned
//   'duration'  total minutes trained
//   'workouts'  number of workouts
// These are the exact values George's backend/src/db/goals.js adds up. GoalCard uses the
// labels and units below, and the goals form can offer GOAL_TYPE_OPTIONS in its dropdown,
// so the form, the card and the server always agree.

export const GOAL_TYPES = {
  calories: { label: 'Burn calories', unit: 'kcal' },
  duration: { label: 'Train for minutes', unit: 'min' },
  workouts: { label: 'Number of workouts', unit: 'workouts' },
};

// [{ value: 'calories', label: 'Burn calories' }, ...] for a <select>.
export const GOAL_TYPE_OPTIONS = Object.entries(GOAL_TYPES).map(([value, { label }]) => ({ value, label }));

// A type we do not know (for example old demo data) still shows, with its own name and no unit.
export function goalTypeInfo(type) {
  return GOAL_TYPES[type] || { label: String(type || 'Goal'), unit: '' };
}
