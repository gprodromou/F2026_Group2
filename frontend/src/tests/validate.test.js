import {
  required,
  email,
  minLength,
  positiveNumber,
  nonNegativeNumber,
  pastDate,
  validateForm,
  registerRules,
  loginRules,
} from '../lib/validate';

describe('required', () => {
  test('accepts a filled value', () => expect(required('Anna')).toBeNull());
  test('refuses empty and whitespace', () => {
    expect(required('')).not.toBeNull();
    expect(required('   ')).not.toBeNull();
    expect(required(null)).not.toBeNull();
  });
});

describe('email', () => {
  test('accepts a good email', () => expect(email('a@b.com')).toBeNull());
  test('refuses malformed emails', () => {
    expect(email('abc')).not.toBeNull();
    expect(email('a@b')).not.toBeNull();
    expect(email('a b@c.com')).not.toBeNull();
  });
  test('refuses empty', () => expect(email('')).not.toBeNull());
});

describe('minLength', () => {
  test('exactly the minimum is accepted', () =>
    expect(minLength('12345678', 8)).toBeNull());
  test('one below the minimum is refused', () =>
    expect(minLength('1234567', 8)).not.toBeNull());
});

describe('positiveNumber (duration > 0)', () => {
  test('accepts 1 and "30"', () => {
    expect(positiveNumber(1)).toBeNull();
    expect(positiveNumber('30')).toBeNull();
  });
  test('refuses 0, negative, empty and text', () => {
    expect(positiveNumber(0)).not.toBeNull();
    expect(positiveNumber(-5)).not.toBeNull();
    expect(positiveNumber('')).not.toBeNull();
    expect(positiveNumber('abc')).not.toBeNull();
  });
});

describe('nonNegativeNumber (calories >= 0)', () => {
  test('accepts 0 and positive', () => {
    expect(nonNegativeNumber(0)).toBeNull();
    expect(nonNegativeNumber('250')).toBeNull();
  });
  test('refuses negative, empty and text', () => {
    expect(nonNegativeNumber(-1)).not.toBeNull();
    expect(nonNegativeNumber('')).not.toBeNull();
    expect(nonNegativeNumber('x')).not.toBeNull();
  });
});

describe('pastDate', () => {
  test('accepts a past date', () => expect(pastDate('2000-01-01')).toBeNull());
  test('refuses a future date, garbage and empty', () => {
    expect(pastDate('2999-01-01')).not.toBeNull();
    expect(pastDate('not-a-date')).not.toBeNull();
    expect(pastDate('')).not.toBeNull();
  });
});

describe('validateForm', () => {
  const good = {
    name: 'Anna',
    email: 'anna@example.com',
    password: 'secret123',
    dateOfBirth: '2001-05-04',
    height: '170',
    weight: '60',
  };

  test('a valid register form gives no errors', () =>
    expect(validateForm(good, registerRules)).toEqual({}));

  test('an empty register form fails every field', () => {
    const errors = validateForm({}, registerRules);
    expect(Object.keys(errors).sort()).toEqual(Object.keys(registerRules).sort());
  });

  test('only the bad field is reported', () => {
    const errors = validateForm({ ...good, weight: '-3' }, registerRules);
    expect(Object.keys(errors)).toEqual(['weight']);
  });

  test('login rules need email and password', () => {
    expect(validateForm({ email: 'a@b.com', password: 'x' }, loginRules)).toEqual({});
    expect(Object.keys(validateForm({}, loginRules))).toEqual(['email', 'password']);
  });
});