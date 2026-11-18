import { handleAuthExpired, isTokenExpiredError } from './branchService';

// Member Notifications API Service
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

function getMemberHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('member_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function parseApiError(errBody, status, fallbackMessage = 'Operation failed') {
  if (!errBody) return `${fallbackMessage} (${status || 'Unknown'})`;
  if (typeof errBody === 'string') return errBody;
  if (typeof errBody.detail === 'string') return errBody.detail;
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
  if (typeof errBody.message === 'string') return errBody.message;
  if (typeof errBody.error === 'string') return errBody.error;
  return `${fallbackMessage} (${status || 'Error'})`;
}

function checkNotificationResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired('member');
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/**
 * 1. GET /member/notifications - List My Notifications
 */
export async function getMemberNotifications({ skip = 0, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/notifications${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, 'Failed to fetch notifications');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.notifications)) return data.notifications;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('notificationService.getMemberNotifications error:', error);
    throw error;
  }
}

/**
 * 2. GET /member/notifications/unread-count - Count Unread Notifications
 */
export async function getMemberUnreadCount() {
  try {
    const res = await fetch(`${BASE_URL}/member/notifications/unread-count`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, 'Failed to fetch unread count');
    }

    const data = await res.json();
    if (typeof data === 'number') return data;
    if (data && typeof data.unread_count === 'number') return data.unread_count;
    if (data && typeof data.count === 'number') return data.count;
    if (data && typeof data.unread === 'number') return data.unread;
    return Number(data) || 0;
  } catch (error) {
    console.error('notificationService.getMemberUnreadCount error:', error);
    return 0;
  }
}

export const NOTIFICATIONS_UPDATED_EVENT = 'member-notifications-updated';

export function notifyNotificationsUpdated(count) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, {
        detail: { unreadCount: typeof count === 'number' ? count : null }
      })
    );
  }
}

/**
 * 3. PATCH /member/notifications/read-all - Mark All Notifications Read
 */
export async function markAllNotificationsRead() {
  try {
    const res = await fetch(`${BASE_URL}/member/notifications/read-all`, {
      method: 'PATCH',
      headers: getMemberHeaders(),
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, 'Failed to mark all notifications as read');
    }

    const data = await res.json().catch(() => ({ success: true }));
    notifyNotificationsUpdated(0);
    return data;
  } catch (error) {
    console.error('notificationService.markAllNotificationsRead error:', error);
    throw error;
  }
}

/**
 * 4. PATCH /member/notifications/{notification_id}/read - Mark Notification Read
 */
export async function markNotificationRead(notificationId) {
  try {
    const res = await fetch(`${BASE_URL}/member/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getMemberHeaders(),
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkNotificationResponseStatus(res, errBody, `Failed to mark notification #${notificationId} as read`);
    }

    const data = await res.json().catch(() => ({ success: true }));
    notifyNotificationsUpdated();
    return data;
  } catch (error) {
    console.error(`notificationService.markNotificationRead(${notificationId}) error:`, error);
    throw error;
  }
}

export default {
  getMemberNotifications,
  getMemberUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notifyNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,
};
