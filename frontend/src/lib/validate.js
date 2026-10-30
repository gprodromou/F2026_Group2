// Form validation helpers (NFR04, NFR05).
// Every validator takes a value and returns an error message (string),
// or null when the value is valid.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function toNumber(value) {
  if (isEmpty(value)) return NaN;
  return Number(value);
}

export function required(value, label = 'This field') {
  return isEmpty(value) ? `${label} is required` : null;
}

export function email(value) {
  if (isEmpty(value)) return 'Email is required';
  return EMAIL_RE.test(String(value).trim()) ? null : 'Enter a valid email address';
}

export function minLength(value, min, label = 'This field') {
  if (isEmpty(value)) return `${label} is required`;
  return String(value).length >= min
    ? null
    : `${label} must be at least ${min} characters`;
}

// Strictly greater than zero, e.g. workout duration (NFR04).
export function positiveNumber(value, label = 'Value') {
  const n = toNumber(value);
  if (Number.isNaN(n)) return `${label} must be a number`;
  return n > 0 ? null : `${label} must be greater than 0`;
}

// Zero or more, e.g. calories burned (NFR04).
export function nonNegativeNumber(value, label = 'Value') {
  const n = toNumber(value);
  if (Number.isNaN(n)) return `${label} must be a number`;
  return n >= 0 ? null : `${label} cannot be negative`;
}

// A date that is not in the future, e.g. date of birth.
export function pastDate(value, label = 'Date') {
  if (isEmpty(value)) return `${label} is required`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${label} is not a valid date`;
  return d <= new Date() ? null : `${label} cannot be in the future`;
}

// rules = { fieldName: (value, values) => errorOrNull }
// Returns only the fields that failed; {} means the form is valid.
export function validateForm(values, rules) {
  const errors = {};
  for (const field of Object.keys(rules)) {
    const message = rules[field](values[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}

export const registerRules = {
  name: (v) => required(v, 'Name'),
  email: (v) => email(v),
  password: (v) => minLength(v, 8, 'Password'),
  dateOfBirth: (v) => pastDate(v, 'Date of birth'),
  height: (v) => positiveNumber(v, 'Height'),
  weight: (v) => positiveNumber(v, 'Weight'),
};

export const loginRules = {
  email: (v) => email(v),
  password: (v) => required(v, 'Password'),
};