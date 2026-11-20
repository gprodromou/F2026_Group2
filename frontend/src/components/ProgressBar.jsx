// ProgressBar.jsx: a bar whose filled part is a percentage (Bogdan C, week 5; RQ11, UC07).
//
//   <ProgressBar percent={64} status="active" label="Burn calories" />
//
// percent  0 to 100. Anything below 0 shows as 0 and anything above 100 as 100
//          (George's server already caps it at 100; the bar double-checks).
// status   'active' | 'completed' | 'expired' -> changes the colour of the fill
// label    what the bar is about, read out by screen readers
//
// role="progressbar" with aria-valuenow is the standard way to tell a screen reader
// "this is 64 per cent done" (WCAG, from the report's accessibility section).

import './ProgressBar.css';

export function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0; // missing or not a number -> empty bar
  return Math.min(100, Math.max(0, Math.round(number)));
}

export default function ProgressBar({ percent, status = 'active', label = 'Progress' }) {
  const value = clampPercent(percent);

  return (
    <div className={`progress progress--${status}`}>
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="progress__fill" style={{ width: `${value}%` }} />
      </div>
      <span className="progress__value">{value}%</span>
    </div>
  );
}
