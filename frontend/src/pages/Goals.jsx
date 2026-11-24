// Goals.jsx: the goals screen (Bogdan C, week 6; RQ11, RQ13, UC07).
// Shows the signed-in user's goals, one GoalCard each, with its status and progress bar.
//   - The list comes from listGoalsWithProgress(api) (api/goals.js): every goal plus the
//     answer of GET /goals/:id/progress. If one progress request fails, that card still
//     shows and says progress is not available, instead of the whole page breaking.
//   - Order: active goals first, then completed, then expired; inside each group the
//     nearest target date first, so the goal that needs attention is at the top.
//   - States: loading, error (message from the server), no goals yet, the list.
//   - The page sits in AppShell (big title, menu button, footer), like the history screen.
//   - Yanna's create-goal form goes in the marked spot above the list (next step).

import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import GoalCard from '../components/GoalCard';
import { FormError } from '../components/ui';
import { useAuth } from '../state/AuthContext';
import { useApi } from '../api/client';
import { listGoalsWithProgress } from '../api/goals';
import './Goals.css';

const STATUS_ORDER = { active: 0, completed: 1, expired: 2 };

// The status to sort by: the progress answer is newer than the list, so it wins.
function statusOf(goal) {
  return (goal.progress && goal.progress.status) || goal.status || 'active';
}

// Active first, then completed, then expired; nearest target date first in each group.
export function sortGoals(goals) {
  return [...goals].sort((a, b) => {
    const byStatus = (STATUS_ORDER[statusOf(a)] ?? 3) - (STATUS_ORDER[statusOf(b)] ?? 3);
    if (byStatus !== 0) return byStatus;
    return String(a.target_date || '').localeCompare(String(b.target_date || ''));
  });
}

export default function Goals() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSignedIn) return undefined;
    let stillHere = true; // the page may close before the answer arrives

    (async () => {
      setLoading(true);
      setError('');
      try {
        const list = await listGoalsWithProgress(apiRef.current);
        if (stillHere) setGoals(sortGoals(list));
      } catch (e) {
        if (stillHere && e.status !== 401) setError(e.message); // 401: the client signs out
      } finally {
        if (stillHere) setLoading(false);
      }
    })();

    return () => {
      stillHere = false;
    };
  }, [isSignedIn]);

  if (!isSignedIn) return <Navigate to="/login" replace />;

  return (
    <AppShell title="My Goals">
      <div className="goals-page">
        {/* Yanna: the create-goal form goes here, above the list. */}

        <FormError message={error} />

        {loading && (
          <p className="goals-message" role="status">Loading your goals…</p>
        )}

        {!loading && !error && goals.length === 0 && (
          <p className="goals-message">You have not set any goals yet.</p>
        )}

        {!loading && goals.length > 0 && (
          <ul className="goals-list" aria-label="Your goals">
            {goals.map((goal) => (
              <li key={goal.goal_id}>
                <GoalCard goal={goal} progress={goal.progress} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
