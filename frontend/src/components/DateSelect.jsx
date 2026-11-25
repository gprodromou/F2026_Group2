// DateSelect.jsx: a date as three dropdowns (Day, Month written out, Year) plus a petrol
// calendar button (Yanna, week 7). One look for every date in the app: Register's birthday
// and the Workout Log's date use this same component.
//
// Props
//   ids       { day, month, year }  the ids (and names) of the three dropdowns
//   value     { day, month, year }  strings, '' when not chosen (month is its number: 3 = March)
//   onChange  (next) => ...         gets the whole new { day, month, year }
//   years     [2026, 2025, ...]     what the Year dropdown offers, newest first
//   min, max  "YYYY-MM-DD"          the range the calendar allows
//   disabled  while the form is sending
//
// Choosing a month or year that makes the chosen day impossible (31 -> February) clears the day.
// The calendar is a real <input type="date"> laid invisibly over the icon, so a click on the
// icon opens the browser's own date picker; picking a date fills all three dropdowns.

import { MONTH_NAMES, daysInMonth, isoToParts, pad } from '../lib/dates';
import './DateSelect.css';

export default function DateSelect({ ids, value, onChange, years, min, max, disabled = false }) {
  const { day, month, year } = value;

  function change(part, next) {
    const updated = { ...value, [part]: next };
    if (part !== 'day' && Number(updated.day) > daysInMonth(updated.year, updated.month)) {
      updated.day = '';
    }
    onChange(updated);
  }

  function fromCalendar(event) {
    const parts = isoToParts(event.target.value);
    if (parts.day) onChange(parts);
  }

  const calendarValue = day && month && year ? `${year}-${pad(month)}-${pad(day)}` : '';

  return (
    <div className="date-select">
      <div className="date-select__day">
        <label className="field__label field__label--hidden" htmlFor={ids.day}>Day</label>
        <select id={ids.day} name={ids.day} className="select-pill" value={day} disabled={disabled}
          onChange={(e) => change('day', e.target.value)}>
          <option value="" disabled>Day</option>
          {Array.from({ length: daysInMonth(year, month) }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
          ))}
        </select>
      </div>

      <div className="date-select__month">
        <label className="field__label field__label--hidden" htmlFor={ids.month}>Month</label>
        <select id={ids.month} name={ids.month} className="select-pill" value={month} disabled={disabled}
          onChange={(e) => change('month', e.target.value)}>
          <option value="" disabled>Month</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={String(i + 1)}>{name}</option>
          ))}
        </select>
      </div>

      <div className="date-select__year">
        <label className="field__label field__label--hidden" htmlFor={ids.year}>Year</label>
        <select id={ids.year} name={ids.year} className="select-pill" value={year} disabled={disabled}
          onChange={(e) => change('year', e.target.value)}>
          <option value="" disabled>Year</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>

      <span className="date-select__calendar">
        <svg className="date-select__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 10h17M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="7" y="13" width="3" height="3" rx="0.6" fill="currentColor" />
        </svg>
        <input
          type="date"
          className="date-select__input"
          aria-label="Choose from a calendar"
          min={min}
          max={max}
          value={calendarValue}
          disabled={disabled}
          onChange={fromCalendar}
          onClick={(event) => {
            try { event.currentTarget.showPicker?.(); } catch { /* older browsers open it themselves */ }
          }}
        />
      </span>
    </div>
  );
}
