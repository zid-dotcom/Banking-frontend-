// Announcement API service connecting to backend superadmin announcements endpoints
import { handleAuthExpired, isTokenExpiredError } from './branchService';
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Standard request headers helper
 */
function getHeaders() {
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

export { handleAuthExpired };

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
function checkResponseStatus(res, errBody, defaultMsg, role = null) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role);
    throw new Error('Token is expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/announcements - List Announcements
 * Query params: skip, limit, is_active, search
 */
export async function getAnnouncements({ skip = 0, limit = 50, is_active, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (is_active !== undefined && is_active !== null && is_active !== 'all') {
      params.append('is_active', String(is_active));
    }
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/announcements${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch announcements');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.announcements)) return data.announcements;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('announcementService.getAnnouncements error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/announcements/{announcement_id} - Get Announcement Details
 */
export async function getAnnouncement(announcementId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/announcements/${announcementId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch announcement #${announcementId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`announcementService.getAnnouncement(${announcementId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/announcements - Create Announcement
 * Body: { title, message, is_active, target_account_roles, target_staff_role_ids }
 */
export async function createAnnouncement(announcementData) {
  try {
    const payload = {
      title: announcementData.title?.trim() || '',
      message: announcementData.message?.trim() || '',
      is_active: announcementData.is_active !== undefined ? Boolean(announcementData.is_active) : true,
    };

    if (announcementData.target_account_roles !== undefined) {
      payload.target_account_roles = Array.isArray(announcementData.target_account_roles)
        ? announcementData.target_account_roles
        : [];
    }

    if (announcementData.target_staff_role_ids !== undefined) {
      payload.target_staff_role_ids = Array.isArray(announcementData.target_staff_role_ids)
        ? announcementData.target_staff_role_ids.map(Number).filter((n) => !isNaN(n))
        : [];
    }

    const res = await fetch(`${BASE_URL}/superadmin/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create announcement');
    }

    return await res.json();
  } catch (error) {
    console.error('announcementService.createAnnouncement error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/announcements/{announcement_id} - Update Announcement
 * Body: { title, message, is_active, target_account_roles?, target_staff_role_ids? }
 */
export async function updateAnnouncement(announcementId, announcementData) {
  try {
    const payload = {
      title: announcementData.title?.trim() || '',
      message: announcementData.message?.trim() || '',
      is_active: announcementData.is_active !== undefined ? Boolean(announcementData.is_active) : true,
    };

    if (announcementData.target_account_roles !== undefined) {
      payload.target_account_roles = Array.isArray(announcementData.target_account_roles)
        ? announcementData.target_account_roles
        : [];
    }

    if (announcementData.target_staff_role_ids !== undefined) {
      payload.target_staff_role_ids = Array.isArray(announcementData.target_staff_role_ids)
        ? announcementData.target_staff_role_ids.map(Number).filter((n) => !isNaN(n))
        : [];
    }

    const res = await fetch(`${BASE_URL}/superadmin/announcements/${announcementId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update announcement #${announcementId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`announcementService.updateAnnouncement(${announcementId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /superadmin/announcements/{announcement_id} - Delete Announcement
 */
export async function deleteAnnouncement(announcementId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete announcement #${announcementId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`announcementService.deleteAnnouncement(${announcementId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /superadmin/announcements/{announcement_id}/status - Change Announcement Status
 * Body: { is_active: boolean }
 */
export async function changeAnnouncementStatus(announcementId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/announcements/${announcementId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to change status for announcement #${announcementId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`announcementService.changeAnnouncementStatus(${announcementId}) error:`, error);
    throw error;
  }
}

/**
 * 7. GET /member/announcements - List Announcements For Member
 */
export async function getMemberAnnouncements({ skip = 0, limit = 50 } = {}) {
  try {
    const token =
      localStorage.getItem('member_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/announcements${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch member announcements', 'member');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.announcements)) return data.announcements;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('announcementService.getMemberAnnouncements error:', error);
    throw error;
  }
}

/**
 * 8. GET /branch-admin/announcements - List Announcements For Branch Admin
 */
export async function getBranchAdminAnnouncements({ skip = 0, limit = 50 } = {}) {
  try {
    const token =
      localStorage.getItem('branch_token') ||
      localStorage.getItem('branch_admin_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/announcements${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch admin announcements', 'branch_manager');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.announcements)) return data.announcements;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('announcementService.getBranchAdminAnnouncements error:', error);
    throw error;
  }
}

/**
 * 9. GET /staff/announcements - List Announcements For Staff
 * Cashiers, Accountants, and Customer Service Officers can fetch active announcements targeted to their assigned staff role.
 * Supports skip, limit, and search.
 */
export async function getStaffAnnouncements({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const token =
      localStorage.getItem('staff_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/announcements${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch staff announcements', 'staff');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.announcements)) return data.announcements;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('announcementService.getStaffAnnouncements error:', error);
    throw error;
  }
}
