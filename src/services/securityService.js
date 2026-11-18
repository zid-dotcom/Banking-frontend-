import { handleAuthExpired, isTokenExpiredError } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

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
 * Standard request headers helper for Member
 */
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

/**
 * Parse user friendly error from response body
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

function checkRequestStatus(res, errBody, defaultMsg, role = 'super_admin') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role);
    throw new Error('Your session has expired. Please sign in again.');
  }
  throw new Error(parsedMsg);
}

/* =========================================================================
   1. SUPERADMIN SECURITY EVENTS APIS
   ========================================================================= */

/**
 * GET /superadmin/security-events - List Security Events
 * Query params: skip, limit, branch_id, user_id, role, event_type, succeeded, suspicious_only, from_date, to_date, search
 */
export async function getSuperadminSecurityEvents({
  skip = 0,
  limit = 50,
  branch_id = null,
  user_id = null,
  role = null,
  event_type = null,
  succeeded = null,
  suspicious_only = false,
  from_date = null,
  to_date = null,
  search = '',
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit) params.append('limit', String(limit));
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (user_id) params.append('user_id', String(user_id));
    if (role && role !== 'all') params.append('role', String(role));
    if (event_type && event_type !== 'all') params.append('event_type', String(event_type));
    if (succeeded !== null && succeeded !== undefined && succeeded !== 'all') {
      params.append('succeeded', String(succeeded));
    }
    if (suspicious_only) params.append('suspicious_only', 'true');
    if (from_date) params.append('from_date', from_date);
    if (to_date) params.append('to_date', to_date);
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/security-events${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch security events', 'super_admin');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('securityService.getSuperadminSecurityEvents error:', error);
    throw error;
  }
}

/**
 * GET /superadmin/security-events/summary - Get Security Event Summary
 * Query params: from_date, to_date
 * Returns { total_events: number, suspicious_events: number, branches: [{ branch_id, branch_name, event_count, suspicious_count }] }
 */
export async function getSuperadminSecurityEventsSummary({ from_date = null, to_date = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (from_date) params.append('from_date', from_date);
    if (to_date) params.append('to_date', to_date);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/security-events/summary${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch security events summary', 'super_admin');
    }

    const data = await res.json();
    return {
      total_events: Number(data?.total_events) || 0,
      suspicious_events: Number(data?.suspicious_events) || 0,
      branches: Array.isArray(data?.branches) ? data.branches : [],
    };
  } catch (error) {
    console.error('securityService.getSuperadminSecurityEventsSummary error:', error);
    throw error;
  }
}

/* =========================================================================
   2. BRANCH ADMIN SECURITY EVENTS APIS
   ========================================================================= */

/**
 * GET /branch-admin/security-events - List Branch Security Events
 * Query params: skip, limit, user_id, role, event_type, succeeded, suspicious_only, from_date, to_date, search
 */
export async function getBranchAdminSecurityEvents({
  skip = 0,
  limit = 50,
  user_id = null,
  role = null,
  event_type = null,
  succeeded = null,
  suspicious_only = false,
  from_date = null,
  to_date = null,
  search = '',
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit) params.append('limit', String(limit));
    if (user_id) params.append('user_id', String(user_id));
    if (role && role !== 'all') params.append('role', String(role));
    if (event_type && event_type !== 'all') params.append('event_type', String(event_type));
    if (succeeded !== null && succeeded !== undefined && succeeded !== 'all') {
      params.append('succeeded', String(succeeded));
    }
    if (suspicious_only) params.append('suspicious_only', 'true');
    if (from_date) params.append('from_date', from_date);
    if (to_date) params.append('to_date', to_date);
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/security-events${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch branch security events', 'branch_manager');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('securityService.getBranchAdminSecurityEvents error:', error);
    throw error;
  }
}

/* =========================================================================
   3. MEMBER SECURITY EVENTS APIS
   ========================================================================= */

/**
 * GET /member/security-events - List Member Security Events
 * Query params: skip, limit, event_type, succeeded, suspicious_only, from_date, to_date
 */
export async function getMemberSecurityEvents({
  skip = 0,
  limit = 50,
  event_type = null,
  succeeded = null,
  suspicious_only = false,
  from_date = null,
  to_date = null,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit) params.append('limit', String(limit));
    if (event_type && event_type !== 'all') params.append('event_type', String(event_type));
    if (succeeded !== null && succeeded !== undefined && succeeded !== 'all') {
      params.append('succeeded', String(succeeded));
    }
    if (suspicious_only) params.append('suspicious_only', 'true');
    if (from_date) params.append('from_date', from_date);
    if (to_date) params.append('to_date', to_date);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/security-events${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch member security events', 'member');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('securityService.getMemberSecurityEvents error:', error);
    throw error;
  }
}

/* =========================================================================
   HELPERS & FORMATTERS
   ========================================================================= */

/**
 * Formats event type string into a readable title (e.g. "password_change" -> "Password Change")
 */
export function formatSecurityEventType(eventType) {
  if (!eventType) return 'Security Event';
  return eventType
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Formats account role into a consistent, polished title
 * Normalizes 'branch_admin' or 'branch_manager' -> 'Branch Manager'
 */
export function formatAccountRole(role) {
  if (!role) return '—';
  const r = role.toLowerCase().replace(/[\s_-]+/g, '');
  if (r.includes('branch') && (r.includes('admin') || r.includes('manager'))) {
    return 'Branch Manager';
  }
  if (r.includes('super')) {
    return 'Super Admin';
  }
  if (r.includes('staff')) {
    return 'Branch Staff';
  }
  if (r.includes('member')) {
    return 'Member';
  }
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns badge styling based on event type
 */
export function getSecurityEventTypeBadge(eventType = '') {
  const type = String(eventType).toLowerCase();

  if (type.includes('fail') || type.includes('denied') || type.includes('invalid') || type.includes('breach')) {
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    };
  }
  if (type.includes('login') || type.includes('auth') || type.includes('token')) {
    return {
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-teal-500',
    };
  }
  if (type.includes('password') || type.includes('pin') || type.includes('credential')) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    };
  }
  if (type.includes('logout') || type.includes('session')) {
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };
  }
  return {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  };
}
