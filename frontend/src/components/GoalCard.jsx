// GoalCard.jsx: one goal with its target, its date, its status and its progress bar
// (Bogdan C, week 5; RQ11, RQ13, UC07). Used by the goals screen, and by the dashboard in week 6.
//
//   <GoalCard goal={goal} progress={progress}>
//     ...optional buttons (Edit, Delete) from the page go here...
//   </GoalCard>
//
// goal      one item from GET /goals:
//           { goal_id, goal_type, target_value, target_date, status }
// progress  the answer of GET /goals/:id/progress. undefined = still loading, null = it failed:
//           { current, target, percent, status }
// children  anything the page wants at the bottom of the card, usually its action buttons.
//           The card itself never fetches or changes data.
//
// Status (worked out by George's goals.js every time a goal is read):
//   active     the target date has not passed and the target is not reached yet
//   completed  the target is reached
//   expired    the target date passed before the target was reached

import Card from './ui/Card';
import ProgressBar from './ProgressBar';
import { goalTypeInfo } from '../lib/goalTypes';
import './GoalCard.css';

const STATUS_TEXT = {
  active: 'Active',
  completed: 'Completed',
  expired: 'Expired',
};

// '2026-12-31' -> '31 Dec 2026'. Built from the parts (not new Date('2026-12-31')), because
// that would be read as UTC midnight and could show the day before in some time zones.
export function formatTargetDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(text || ''));
  if (!match) return String(text || '');
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GoalCard({ goal, progress, children }) {
  const { label, unit } = goalTypeInfo(goal.goal_type);
  const status = (progress && progress.status) || goal.status || 'active';
  const target = progress ? progress.target : goal.target_value;
  const unitText = unit ? ` ${unit}` : '';

  return (
    <div className={`goal-card goal-card--${status}`}>
      <Card title={label}>
        <p className="goal-card__status">
          <span className={`goal-card__badge goal-card__badge--${status}`}>
            {STATUS_TEXT[status] || status}
          </span>
        </p>

        <p className="goal-card__target">
          {progress ? (
            <>
              <strong>{progress.current}</strong> of {target}
              {unitText}
            </>
          ) : (
            <>
              Target: {target}
              {unitText}
            </>
          )}
        </p>

        <p className="goal-card__date">
          {status === 'expired' ? 'Target date passed: ' : 'By '}
          <time dateTime={goal.target_date}>{formatTargetDate(goal.target_date)}</time>
        </p>

        {progress ? (
          <ProgressBar percent={progress.percent} status={status} label={`${label} progress`} />
        ) : (
          <p className="goal-card__loading">
            {progress === null ? 'Progress is not available right now.' : 'Loading progress...'}
          </p>
        )}

        {children && <div className="goal-card__actions">{children}</div>}
      </Card>
    </div>
  );
}
