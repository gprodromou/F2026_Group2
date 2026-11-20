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
