import { handleAuthExpired, isTokenExpiredError, parseApiError } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Standard token retrieval helper based on portal role
 */
export function getAuthHeaders(role = 'member') {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const r = String(role || '').toLowerCase();
  let token = null;

  if (r === 'super_admin' || r === 'superadmin') {
    token =
      localStorage.getItem('superadmin_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');
  } else if (r === 'branch_manager' || r === 'branch_admin' || r === 'branch') {
    token =
      localStorage.getItem('branch_token') ||
      localStorage.getItem('branch_manager_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');
  } else if (r === 'staff' || r === 'accountant') {
    token =
      localStorage.getItem('staff_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');
  } else {
    // member
    token =
      localStorage.getItem('member_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Role-specific header helper aliases
export const getSuperAdminHeaders = () => getAuthHeaders('super_admin');
export const getBranchAdminHeaders = () => getAuthHeaders('branch_admin');
export const getStaffHeaders = () => getAuthHeaders('staff');
export const getMemberHeaders = () => getAuthHeaders('member');

function checkNotificationResponseStatus(res, errBody, defaultMsg, role = 'member') {
  const parsedMsg = parseApiError ? parseApiError(errBody, res.status, defaultMsg) : (errBody?.detail || defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    const normalizedRole =
      role === 'super_admin' || role === 'superadmin'
        ? 'super_admin'
        : role === 'branch_manager' || role === 'branch_admin'
        ? 'branch_manager'
        : role === 'staff' || role === 'accountant'
        ? 'staff'
        : 'member';
    handleAuthExpired(normalizedRole);
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/**
 * Resolve base API path for role notifications
 * - Staff / Accountant: /staff/notifications
 * - Branch Admin: /branch-admin/notifications
 * - Superadmin: /superadmin/notifications
 * - Member: /member/notifications
 */
export function getNotificationBasePath(role = 'member') {
  const r = String(role || '').toLowerCase();
  if (r === 'super_admin' || r === 'superadmin') {
    return '/superadmin/notifications';
  }
  if (r === 'branch_manager' || r === 'branch_admin' || r === 'branch') {
    return '/branch-admin/notifications';
  }
  if (r === 'staff' || r === 'accountant') {
    return '/staff/notifications';
  }
  return '/member/notifications';
}

export const NOTIFICATIONS_UPDATED_EVENT = 'notifications-updated';

export function notifyNotificationsUpdated(role = 'member', count) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { role, unreadCount: typeof count === 'number' ? count : null }
      })
    );
    window.dispatchEvent(
      new CustomEvent('member-notifications-updated', {
        detail: { unreadCount: typeof count === 'number' ? count : null }
      })
    );
  }
}

// =========================================================================
// Generic Role-based Dispatchers
// =========================================================================

/**
 * 1. GET {basePath} - List alerts
 */
export async function fetchNotificationsForRole(role = 'member', { skip = 0, limit = 50 } = {}) {
  try {
    const basePath = getNotificationBasePath(role);
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}${basePath}${qs}`, {
      method: 'GET',
      headers: getAuthHeaders(role),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, 'Failed to fetch notifications', role);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.notifications)) return data.notifications;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.alerts)) return data.alerts;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error(`notificationService.fetchNotificationsForRole(${role}) error:`, error);
    throw error;
  }
}

/**
 * 2. GET {basePath}/unread-count - Unread count
 */
export async function fetchUnreadCountForRole(role = 'member') {
  try {
    const basePath = getNotificationBasePath(role);
    const res = await fetch(`${BASE_URL}${basePath}/unread-count`, {
      method: 'GET',
      headers: getAuthHeaders(role),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, 'Failed to fetch unread count', role);
    }

    const data = await res.json();
    if (typeof data === 'number') return data;
    if (data && typeof data.unread_count === 'number') return data.unread_count;
    if (data && typeof data.count === 'number') return data.count;
    if (data && typeof data.unread === 'number') return data.unread;
    if (data && typeof data.total === 'number') return data.total;
    return Number(data) || 0;
  } catch (error) {
    console.error(`notificationService.fetchUnreadCountForRole(${role}) error:`, error);
    return 0;
  }
}

/**
 * 3. PATCH {basePath}/{id}/read - Mark one read
 */
export async function markNotificationReadForRole(role = 'member', notificationId) {
  try {
    const basePath = getNotificationBasePath(role);
    const res = await fetch(`${BASE_URL}${basePath}/${notificationId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(role),
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, `Failed to mark notification #${notificationId} as read`, role);
    }

    const data = await res.json().catch(() => ({ success: true }));
    notifyNotificationsUpdated(role);
    return data;
  } catch (error) {
    console.error(`notificationService.markNotificationReadForRole(${role}, ${notificationId}) error:`, error);
    throw error;
  }
}

/**
 * 4. PATCH {basePath}/read-all - Mark all read
 */
export async function markAllNotificationsReadForRole(role = 'member') {
  try {
    const basePath = getNotificationBasePath(role);
    const res = await fetch(`${BASE_URL}${basePath}/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(role),
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, 'Failed to mark all notifications as read', role);
    }

    const data = await res.json().catch(() => ({ success: true }));
    notifyNotificationsUpdated(role, 0);
    return data;
  } catch (error) {
    console.error(`notificationService.markAllNotificationsReadForRole(${role}) error:`, error);
    throw error;
  }
}

// =========================================================================
// Staff / Accountant Notifications
// =========================================================================
export const getStaffNotifications = (options) => fetchNotificationsForRole('staff', options);
export const getStaffUnreadCount = () => fetchUnreadCountForRole('staff');
export const markStaffNotificationRead = (id) => markNotificationReadForRole('staff', id);
export const markStaffAllNotificationsRead = () => markAllNotificationsReadForRole('staff');

// =========================================================================
// Branch Admin Notifications
// =========================================================================
export const getBranchAdminNotifications = (options) => fetchNotificationsForRole('branch_admin', options);
export const getBranchAdminUnreadCount = () => fetchUnreadCountForRole('branch_admin');
export const markBranchAdminNotificationRead = (id) => markNotificationReadForRole('branch_admin', id);
export const markBranchAdminAllNotificationsRead = () => markAllNotificationsReadForRole('branch_admin');

// =========================================================================
// Superadmin Notifications
// =========================================================================
export const getSuperAdminNotifications = (options) => fetchNotificationsForRole('super_admin', options);
export const getSuperAdminUnreadCount = () => fetchUnreadCountForRole('super_admin');
export const markSuperAdminNotificationRead = (id) => markNotificationReadForRole('super_admin', id);
export const markSuperAdminAllNotificationsRead = () => markAllNotificationsReadForRole('super_admin');

// =========================================================================
// Member Notifications (Backwards Compatible)
// =========================================================================
export const getMemberNotifications = (options) => fetchNotificationsForRole('member', options);
export const getMemberUnreadCount = () => fetchUnreadCountForRole('member');
export const markNotificationRead = (id) => markNotificationReadForRole('member', id);
export const markMemberNotificationRead = markNotificationRead;
export const markAllNotificationsRead = () => markAllNotificationsReadForRole('member');
export const markMemberAllNotificationsRead = markAllNotificationsRead;

export default {
  // Generic
  fetchNotificationsForRole,
  fetchUnreadCountForRole,
  markNotificationReadForRole,
  markAllNotificationsReadForRole,
  notifyNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,

  // Staff / Accountant
  getStaffNotifications,
  getStaffUnreadCount,
  markStaffNotificationRead,
  markStaffAllNotificationsRead,

  // Branch Admin
  getBranchAdminNotifications,
  getBranchAdminUnreadCount,
  markBranchAdminNotificationRead,
  markBranchAdminAllNotificationsRead,

  // Super Admin
  getSuperAdminNotifications,
  getSuperAdminUnreadCount,
  markSuperAdminNotificationRead,
  markSuperAdminAllNotificationsRead,

  // Member
  getMemberNotifications,
  getMemberUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
};
