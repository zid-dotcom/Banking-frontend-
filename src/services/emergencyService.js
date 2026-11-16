import { handleAuthExpired, isTokenExpiredError } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Standard request headers helper for Branch Admin / Branch Manager
 */
function getBranchAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('branch_token') ||
    localStorage.getItem('branch_admin_token') ||
    localStorage.getItem('branch_manager_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Standard request headers helper for Super Admin
 */
function getSuperAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('superadmin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Parses user-friendly error messages from backend responses
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

function checkRequestStatus(res, errBody, defaultMsg, role = 'branch_manager') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role);
    throw new Error('Your session has expired. Please sign in again.');
  }
  throw new Error(parsedMsg);
}

/* =========================================================================
   BRANCH ADMIN EMERGENCY CASES APIS
   ========================================================================= */

/**
 * 1. POST /branch-admin/emergency-cases
 * Open a new emergency case with subject and first message.
 */
export async function createBranchAdminEmergencyCase({ subject, message }) {
  try {
    const payload = {
      subject: (subject || '').trim(),
      message: (message || '').trim(),
    };

    const res = await fetch(`${BASE_URL}/branch-admin/emergency-cases`, {
      method: 'POST',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to create emergency case', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error('emergencyService.createBranchAdminEmergencyCase error:', error);
    throw error;
  }
}

/**
 * 2. GET /branch-admin/emergency-cases
 * List cases created by this branch admin.
 */
export async function getBranchAdminEmergencyCases({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/emergency-cases${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to list branch emergency cases', 'branch_manager');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('emergencyService.getBranchAdminEmergencyCases error:', error);
    throw error;
  }
}

/**
 * 3. GET /branch-admin/emergency-cases/unread-count
 * Returns { unread_count: number }
 */
export async function getBranchAdminEmergencyUnreadCount() {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/emergency-cases/unread-count`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      return { unread_count: 0 };
    }

    const data = await res.json();
    return typeof data?.unread_count === 'number' ? data : { unread_count: 0 };
  } catch (error) {
    console.warn('emergencyService.getBranchAdminEmergencyUnreadCount error:', error);
    return { unread_count: 0 };
  }
}

/**
 * 4. GET /branch-admin/emergency-cases/{case_id}
 * View the conversation; includes branch details and marks Superadmin messages as read.
 */
export async function getBranchAdminEmergencyCase(caseId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/emergency-cases/${caseId}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to load emergency case #${caseId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`emergencyService.getBranchAdminEmergencyCase(${caseId}) error:`, error);
    throw error;
  }
}

/**
 * 5. POST /branch-admin/emergency-cases/{case_id}/messages
 * Send another message into an existing emergency case thread.
 */
export async function sendBranchAdminEmergencyMessage(caseId, { message }) {
  try {
    const payload = {
      message: (message || '').trim(),
    };

    const res = await fetch(`${BASE_URL}/branch-admin/emergency-cases/${caseId}/messages`, {
      method: 'POST',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to send message to emergency case', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`emergencyService.sendBranchAdminEmergencyMessage(${caseId}) error:`, error);
    throw error;
  }
}

/* =========================================================================
   SUPERADMIN EMERGENCY CASES APIS
   ========================================================================= */

/**
 * 6. GET /superadmin/emergency-cases
 * View cases, optionally filter by branch_id, search, or unread_only=true.
 */
export async function getSuperadminEmergencyCases({
  skip = 0,
  limit = 50,
  branch_id = null,
  unread_only = false,
  search = '',
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit) params.append('limit', String(limit));
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (unread_only) params.append('unread_only', 'true');
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/emergency-cases${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to list superadmin emergency cases', 'super_admin');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('emergencyService.getSuperadminEmergencyCases error:', error);
    throw error;
  }
}

/**
 * 7. GET /superadmin/emergency-cases/unread-count
 * Returns { total_unread_count: number, branches: [{ branch_id, branch_name, branch_code, unread_count }] }
 */
export async function getSuperadminEmergencyUnreadCount() {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/emergency-cases/unread-count`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      return { total_unread_count: 0, branches: [] };
    }

    const data = await res.json();
    return {
      total_unread_count: Number(data?.total_unread_count) || 0,
      branches: Array.isArray(data?.branches) ? data.branches : [],
    };
  } catch (error) {
    console.warn('emergencyService.getSuperadminEmergencyUnreadCount error:', error);
    return { total_unread_count: 0, branches: [] };
  }
}

/**
 * 8. GET /superadmin/emergency-cases/{case_id}
 * View a conversation; marks branch-admin messages as read.
 */
export async function getSuperadminEmergencyCase(caseId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/emergency-cases/${caseId}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to load emergency case #${caseId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`emergencyService.getSuperadminEmergencyCase(${caseId}) error:`, error);
    throw error;
  }
}

/**
 * 9. POST /superadmin/emergency-cases/{case_id}/messages
 * Reply into emergency case.
 */
export async function sendSuperadminEmergencyMessage(caseId, { message }) {
  try {
    const payload = {
      message: (message || '').trim(),
    };

    const res = await fetch(`${BASE_URL}/superadmin/emergency-cases/${caseId}/messages`, {
      method: 'POST',
      headers: getSuperAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to send superadmin reply to emergency case', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`emergencyService.sendSuperadminEmergencyMessage(${caseId}) error:`, error);
    throw error;
  }
}
