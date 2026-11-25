// goals.js: the frontend side of the goal endpoints, through the API client (Bogdan C, week 5).
// Marius's routes: GET /goals (my goals, each with its status) and
// GET /goals/:id/progress ({ goalId, goalType, current, target, percent, status }).
//
// The goals screen (and the dashboard in week 6) can get everything GoalCard needs at once:
//
//   const api = useApi();
//   const goals = await listGoalsWithProgress(api);
//   goals.map((goal) => <GoalCard key={goal.goal_id} goal={goal} progress={goal.progress} />)

export async function listGoals(api) {
  const rows = await api.get('/goals');
  return Array.isArray(rows) ? rows : [];
}

export function getGoalProgress(api, goalId) {
  return api.get(`/goals/${goalId}/progress`);
}

// Each goal plus its progress. The progress requests run at the same time (Promise.all).
// If one progress request fails, that goal still shows, with progress: null
// (GoalCard then says "Progress is not available right now." instead of the whole list breaking).
export async function listGoalsWithProgress(api) {
  const goals = await listGoals(api);
  return Promise.all(
    goals.map(async (goal) => {
      try {
        return { ...goal, progress: await getGoalProgress(api, goal.goal_id) };
      } catch {
        return { ...goal, progress: null };
      }
    })
  );
}

// ---------- creating, changing and deleting goals (Yanna, week 7) ----------
// ⚠ TO CONFIRM WITH MARIUS / GEORGE: these use the usual REST names. If the backend's
// routes or field names are different, change them HERE only; the goals page calls
// these three functions and nothing else.
//   POST   /goals       { goalType, targetValue, targetDate }  -> the new goal
//   PUT    /goals/:id   { targetValue, targetDate }            -> the changed goal
//   DELETE /goals/:id                                          -> nothing
// goalType is 'calories' | 'duration' | 'workouts' (lib/goalTypes.js); targetValue is a
// number (kcal, minutes or workouts); targetDate is 'YYYY-MM-DD'. No user id is sent:
// the server takes it from the login token, like the workouts.

export function createGoal(api, { goalType, targetValue, targetDate }) {
  return api.post('/goals', { goalType, targetValue, targetDate });
}

export function updateGoal(api, goalId, { targetValue, targetDate }) {
  return api.put(`/goals/${goalId}`, { targetValue, targetDate });
}

export function deleteGoal(api, goalId) {
  return api.del(`/goals/${goalId}`);
}
