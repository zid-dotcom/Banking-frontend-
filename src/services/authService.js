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
