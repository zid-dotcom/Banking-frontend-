import { parseApiError, handleAuthExpired, isTokenExpiredError } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Helper to get standard authorization headers across all portal roles
 */
export function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('superadmin_token') ||
    localStorage.getItem('branch_token') ||
    localStorage.getItem('member_token') ||
    localStorage.getItem('staff_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Standard public headers (unauthenticated endpoints)
 */
function getPublicHeaders() {
  return {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };
}

/**
 * POST /auth/change-password
 * Change password for the currently authenticated user (same API across all roles).
 * 
 * Request schema:
 * {
 *   "old_password": "string",
 *   "new_password": "string",
 *   "confirm_password": "string"
 * }
 */
export async function changePassword({ old_password, new_password, confirm_password }) {
  try {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        old_password,
        new_password,
        confirm_password,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to update password');
      if (isTokenExpiredError(res, msg)) {
        handleAuthExpired();
      }
      throw new Error(msg);
    }

    const data = await res.json().catch(() => ({ message: 'Password updated successfully' }));
    return data;
  } catch (error) {
    console.error('authService.changePassword error:', error);
    throw error;
  }
}

/**
 * 1. Member Forgot Password
 * POST /member/forgot-password - Request an OTP using the member code; it's sent to the registered email.
 * Body: { "member_code": "..." }
 */
export async function memberForgotPassword(member_code) {
  try {
    const cleanCode = String(member_code || '').trim().replace(/^#/, '');
    const res = await fetch(`${BASE_URL}/member/forgot-password`, {
      method: 'POST',
      headers: getPublicHeaders(),
      body: JSON.stringify({
        member_code: cleanCode,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = parseApiError(data, res.status, 'Failed to request member password reset OTP');
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    console.error('authService.memberForgotPassword error:', error);
    throw error;
  }
}

/**
 * 2. Member Reset Password
 * POST /member/reset-password - Verify the OTP and set a new password.
 * Body: { "member_code": "...", "otp": "...", "new_password": "...", "confirm_password": "..." }
 */
export async function memberResetPassword({ member_code, otp, new_password, confirm_password }) {
  try {
    const cleanCode = String(member_code || '').trim().replace(/^#/, '');
    const res = await fetch(`${BASE_URL}/member/reset-password`, {
      method: 'POST',
      headers: getPublicHeaders(),
      body: JSON.stringify({
        member_code: cleanCode,
        otp: String(otp || '').trim(),
        new_password,
        confirm_password: confirm_password || new_password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = parseApiError(data, res.status, 'Failed to reset member password');
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    console.error('authService.memberResetPassword error:', error);
    throw error;
  }
}

/**
 * 3. Superadmin Forgot Password
 * POST /auth/superadmin/forgot-password - Request an OTP using the registered email.
 * Body: { "email": "..." }
 */
export async function superAdminForgotPassword(email) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const res = await fetch(`${BASE_URL}/auth/superadmin/forgot-password`, {
      method: 'POST',
      headers: getPublicHeaders(),
      body: JSON.stringify({
        email: cleanEmail,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = parseApiError(data, res.status, 'Failed to request superadmin password reset OTP');
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    console.error('authService.superAdminForgotPassword error:', error);
    throw error;
  }
}

/**
 * 4. Superadmin Reset Password
 * POST /auth/superadmin/reset-password - Verify the OTP and set a new password.
 * Body: { "email": "...", "otp": "...", "new_password": "...", "confirm_password": "..." }
 */
export async function superAdminResetPassword({ email, otp, new_password, confirm_password }) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const res = await fetch(`${BASE_URL}/auth/superadmin/reset-password`, {
      method: 'POST',
      headers: getPublicHeaders(),
      body: JSON.stringify({
        email: cleanEmail,
        otp: String(otp || '').trim(),
        new_password,
        confirm_password: confirm_password || new_password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = parseApiError(data, res.status, 'Failed to reset superadmin password');
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    console.error('authService.superAdminResetPassword error:', error);
    throw error;
  }
}
