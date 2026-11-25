// dates.js: small date helpers shared by the date pickers (Yanna, week 7).
// Used by components/DateSelect.jsx (Register's birthday and the Workout Log's date).

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const pad = (n) => String(n).padStart(2, '0');

// A Date -> "YYYY-MM-DD" in the user's own time zone.
export const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// How many days a month has (31 until a month is picked; 29 for February until a year
// is picked, so the 29th is not lost too early).
export function daysInMonth(year, month) {
  if (!month) return 31;
  return new Date(Number(year) || 2000, Number(month), 0).getDate();
}

// { day, month, year } (strings, may be empty) -> "YYYY-MM-DD", "" when all are empty,
// or "invalid" when only some are filled in. lib/validate.js (pastDate) checks the result.
export function partsToIso({ day, month, year }) {
  const d = String(day || '').trim();
  const m = String(month || '').trim();
  const y = String(year || '').trim();
  if (!d && !m && !y) return '';
  if (!d || !m || !/^\d{4}$/.test(y)) return 'invalid';
  return `${y}-${pad(m)}-${pad(d)}`;
}

// "YYYY-MM-DD" -> { day, month, year } without leading zeros ("2026-03-05" -> 5, 3, 2026).
export function isoToParts(iso) {
  const [y, m, d] = String(iso || '').split('-');
  if (!y || !m || !d) return { day: '', month: '', year: '' };
  return { day: String(Number(d)), month: String(Number(m)), year: String(Number(y)) };
}

// Years from `newest` down to `oldest` (for the Year dropdown).
export function yearRange(newest, oldest) {
  const years = [];
  for (let y = newest; y >= oldest; y -= 1) years.push(y);
  return years;
}
