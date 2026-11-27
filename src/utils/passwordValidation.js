/**
 * Strong password validation utility specifically for Member accounts.
 *
 * Rules:
 * 1. Minimum 8 characters
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one numeric digit (0-9)
 * 5. At least one special symbol (!@#$%^&* etc.)
 */
export function validateStrongPassword(password) {
  const pwd = String(password || '');

  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  const passedCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  let message = '';
  if (!pwd) {
    message = 'Password is required.';
  } else if (!hasMinLength) {
    message = 'Password must be at least 8 characters long.';
  } else if (!hasUppercase) {
    message = 'Password must include at least one uppercase letter (A-Z).';
  } else if (!hasLowercase) {
    message = 'Password must include at least one lowercase letter (a-z).';
  } else if (!hasNumber) {
    message = 'Password must include at least one number (0-9).';
  } else if (!hasSpecial) {
    message = 'Password must include at least one special character (!@#$%^&*...).';
  }

  let strengthLabel = 'Weak';
  if (passedCount >= 5) {
    strengthLabel = 'Strong';
  } else if (passedCount >= 3) {
    strengthLabel = 'Moderate';
  }

  return {
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
    score: passedCount,
    strengthLabel,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    message,
  };
}
