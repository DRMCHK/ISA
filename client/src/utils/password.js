export function validatePassword(password) {
  const checks = {
    length: password.length >= 10,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const valid = Object.values(checks).every(Boolean);
  let error = '';
  if (!checks.length) error = 'At least 10 characters';
  else if (!checks.lowercase) error = 'One lowercase letter required';
  else if (!checks.uppercase) error = 'One uppercase letter required';
  else if (!checks.number) error = 'One number required';
  else if (!checks.symbol) error = 'One symbol required (!@#$%^&* etc.)';

  return { valid, error, checks };
}

export function passwordStrength(checks) {
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: 'Weak', color: '#e53e3e' };
  if (passed <= 4) return { label: 'Fair', color: '#d69e2e' };
  return { label: 'Strong', color: '#38a169' };
}
