// Staff Roles API service connecting to backend superadmin staff roles endpoints
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Helper to get standard headers
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token = localStorage.getItem('token') || 
                localStorage.getItem('access_token') || 
                localStorage.getItem('superadmin_token') || 
                localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle expired token: cleans tokens, sets notification, and navigates to login
 */
export function handleAuthExpired(role = 'super_admin') {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('superadmin_token');
  localStorage.removeItem('superadmin_user');
  sessionStorage.setItem('auth_expired_message', 'Token is expired. Please login again.');

  const targetPath = role === 'member'
    ? '/member-login?expired=true'
    : role === 'branch_manager'
    ? '/branch-manager-login?expired=true'
    : '/super-admin/login?expired=true';

  if (!window.location.pathname.includes('/login')) {
    window.location.href = targetPath;
  }
}

/**
 * Extracts and formats user-friendly error messages from backend responses
 */
export function parseApiError(errBody, status, fallbackMessage = 'Operation failed') {
  if (!errBody) return `${fallbackMessage} (${status || 'Unknown'})`;
  if (typeof errBody === 'string') return errBody;

  if (typeof errBody.detail === 'string') {
    return errBody.detail;
  }

  if (Array.isArray(errBody.detail)) {
    const messages = errBody.detail.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const msg = item.msg || item.message || JSON.stringify(item);
        const cleanMsg = msg.replace(/^Value error,\s*/i, '');
        const loc = Array.isArray(item.loc)
          ? item.loc.filter((l) => l !== 'body').join(' -> ')
          : '';
        return loc ? `${loc.replace(/_/g, ' ')}: ${cleanMsg}` : cleanMsg;
      }
      return String(item);
    });
    return messages.filter(Boolean).join(' | ');
  }

  if (typeof errBody.message === 'string') {
    return errBody.message;
  }

  if (typeof errBody.error === 'string') {
    return errBody.error;
  }

  return `${fallbackMessage} (${status || 'Error'})`;
}

/**
 * Inspect response and throw error or redirect on expired token
 */
function checkResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  const isExpired = 
    res.status === 401 || 
    res.status === 403 || 
    parsedMsg.toLowerCase().includes('expired token') || 
    parsedMsg.toLowerCase().includes('invalid or expired') ||
    parsedMsg.toLowerCase().includes('token has expired');

  if (isExpired) {
    if (window.location.pathname.startsWith('/super-admin/')) {
      handleAuthExpired('super_admin');
    }
    throw new Error('Token is expired or insufficient permissions.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/staff-roles - List Staff Roles
 * Supports query params: skip, limit, search
 */
export async function getStaffRoles({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', skip);
    if (limit !== undefined && limit !== null) params.append('limit', limit);
    if (search && search.trim()) params.append('search', search.trim());

    const url = `${BASE_URL}/superadmin/staff-roles${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch staff roles');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.roles)) return data.roles;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('staffRoleService.getStaffRoles error:', error);
    throw error;
  }
}

/**
 * 2. POST /superadmin/staff-roles - Create Staff Role
 * Payload: { name: string, description?: string }
 */
export async function createStaffRole(roleData) {
  try {
    const payload = {
      name: roleData.name?.trim(),
      description: roleData.description?.trim() || null,
    };

    const res = await fetch(`${BASE_URL}/superadmin/staff-roles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create staff role');
    }

    return await res.json();
  } catch (error) {
    console.error('staffRoleService.createStaffRole error:', error);
    throw error;
  }
}

/**
 * 3. DELETE /superadmin/staff-roles/{role_id} - Delete Staff Role
 */
export async function deleteStaffRole(roleId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/staff-roles/${roleId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete staff role #${roleId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`staffRoleService.deleteStaffRole(${roleId}) error:`, error);
    throw error;
  }
}

