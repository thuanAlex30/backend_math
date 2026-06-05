const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function sanitizeString(value, maxLen = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

export function isValidEmail(email) {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export function isValidGrade(grade) {
  const n = Number(grade);
  return Number.isInteger(n) && n >= 6 && n <= 12;
}

export function isValidName(name) {
  const trimmed = sanitizeString(name, 100);
  return trimmed.length >= 2;
}
