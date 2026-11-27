// Monthly Targets and Incentives API service connecting to backend endpoints
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Helper to get standard headers across Super Admin, Branch Admin, and Staff roles
 */
function getHeaders(role = '') {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  let token = null;
  if (role === 'super_admin' || role === 'superadmin') {
    token = localStorage.getItem('superadmin_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
  } else if (role === 'branch_manager' || role === 'branch_admin') {
    token = localStorage.getItem('branch_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
  } else if (role === 'staff') {
    token = localStorage.getItem('staff_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
  } else {
    token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('superadmin_token') ||
      localStorage.getItem('branch_token') ||
      localStorage.getItem('staff_token') ||
      localStorage.getItem('auth_token');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle expired token
 */
export function handleAuthExpired(role = 'super_admin') {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  if (role === 'super_admin') {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
  } else if (role === 'branch_manager') {
    localStorage.removeItem('branch_token');
    localStorage.removeItem('branch_user');
  } else if (role === 'staff') {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
  }
  sessionStorage.setItem('auth_expired_message', 'Token is expired. Please login again.');

  const targetPath =
    role === 'staff'
      ? '/staff-login?expired=true'
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
function checkResponseStatus(res, errBody, defaultMsg, role = 'super_admin') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  const isExpired =
    res.status === 401 ||
    res.status === 403 ||
    parsedMsg.toLowerCase().includes('expired token') ||
    parsedMsg.toLowerCase().includes('invalid or expired') ||
    parsedMsg.toLowerCase().includes('token has expired');

  if (isExpired) {
    handleAuthExpired(role);
    throw new Error('Token is expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

// ==========================================
// SUPERADMIN MONTHLY TARGETS API
// ==========================================

/**
 * GET /superadmin/branch-admins - List branch admins for Superadmin to select
 */
export async function getSuperAdminBranchAdmins({ limit = 100, is_active = true } = {}) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (is_active !== undefined && is_active !== null) params.append('is_active', String(is_active));

    const res = await fetch(`${BASE_URL}/superadmin/branch-admins?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch admins', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.getSuperAdminBranchAdmins error:', error);
    throw error;
  }
}

/**
 * GET /superadmin/monthly-targets/roles - Get selectable roles for targets
 */
export async function getSuperAdminTargetRoles() {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/monthly-targets/roles`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch selectable target roles', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.getSuperAdminTargetRoles error:', error);
    throw error;
  }
}

/**
 * POST /superadmin/monthly-targets - Create Branch Target for Branch Admins
 * Request body:
 * {
 *   "target_month": "2026-12-01",
 *   "target_period": "monthly",
 *   "target_amount": 1000000,
 *   "partial_threshold_percent": 80,
 *   "below_target_incentive_percent": 0,
 *   "partially_achieved_incentive_percent": 1.5,
 *   "target_achieved_incentive_percent": 2.5,
 *   "exceeded_target_incentive_percent": 3,
 *   "branch_admin_user_ids": [1, 2]
 * }
 */
export async function createSuperAdminMonthlyTarget(payload) {
  try {
    const adminIds = Array.isArray(payload.branch_admin_user_ids)
      ? payload.branch_admin_user_ids.map(Number).filter((n) => !isNaN(n))
      : payload.branch_admin_user_id
      ? [Number(payload.branch_admin_user_id)]
      : [];

    const bodyData = {
      target_month: String(payload.target_month || ''),
      target_period: 'monthly',
      target_amount: Number(payload.target_amount),
      partial_threshold_percent: 80,
      below_target_incentive_percent: Number(payload.below_target_incentive_percent ?? 0),
      partially_achieved_incentive_percent: Number(payload.partially_achieved_incentive_percent ?? 0),
      target_achieved_incentive_percent: Number(payload.target_achieved_incentive_percent ?? 0),
      exceeded_target_incentive_percent: Number(payload.exceeded_target_incentive_percent ?? 0),
      branch_admin_user_ids: adminIds,
    };

    const res = await fetch(`${BASE_URL}/superadmin/monthly-targets`, {
      method: 'POST',
      headers: getHeaders('super_admin'),
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create branch target', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.createSuperAdminMonthlyTarget error:', error);
    throw error;
  }
}

/**
 * GET /superadmin/monthly-targets?target_month=YYYY-MM-01 - List targets created by Superadmin
 */
export async function getSuperAdminMonthlyTargets({ target_month } = {}) {
  try {
    const params = new URLSearchParams();
    if (target_month) {
      params.append('target_month', String(target_month));
    }

    const qs = params.toString();
    const url = `${BASE_URL}/superadmin/monthly-targets${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch monthly targets', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.getSuperAdminMonthlyTargets error:', error);
    throw error;
  }
}

// ==========================================
// BRANCH ADMIN MONTHLY TARGETS API
// ==========================================

/**
 * GET /branch-admin/staff - Select staff for Branch Admin to assign targets
 */
export async function getBranchAdminStaffList({ limit = 100, is_active = true } = {}) {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (is_active !== undefined && is_active !== null) params.append('is_active', String(is_active));

    const res = await fetch(`${BASE_URL}/branch-admin/staff?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders('branch_manager'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch staff list', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.getBranchAdminStaffList error:', error);
    throw error;
  }
}

/**
 * POST /branch-admin/monthly-targets/staff - Assign individual target to a staff record
 * Request body:
 * {
 *   "target_month": "2026-12-01",
 *   "target_period": "monthly",
 *   "target_amount": 100000,
 *   "partial_threshold_percent": 80,
 *   "below_target_incentive_percent": 0,
 *   "partially_achieved_incentive_percent": 1.5,
 *   "target_achieved_incentive_percent": 2.5,
 *   "exceeded_target_incentive_percent": 3,
 *   "staff_id": 7
 * }
 */
export async function createBranchAdminStaffTarget(payload) {
  try {
    const bodyData = {
      target_month: String(payload.target_month || ''),
      target_period: 'monthly',
      target_amount: Number(payload.target_amount),
      partial_threshold_percent: 80,
      below_target_incentive_percent: Number(payload.below_target_incentive_percent ?? 0),
      partially_achieved_incentive_percent: Number(payload.partially_achieved_incentive_percent ?? 0),
      target_achieved_incentive_percent: Number(payload.target_achieved_incentive_percent ?? 0),
      exceeded_target_incentive_percent: Number(payload.exceeded_target_incentive_percent ?? 0),
      staff_id: Number(payload.staff_id),
    };

    const res = await fetch(`${BASE_URL}/branch-admin/monthly-targets/staff`, {
      method: 'POST',
      headers: getHeaders('branch_manager'),
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to assign staff target', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.createBranchAdminStaffTarget error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/monthly-targets?target_month=YYYY-MM-01 - List targets for Branch Manager
 */
export async function getBranchAdminMonthlyTargets({ target_month } = {}) {
  try {
    const params = new URLSearchParams();
    if (target_month) {
      params.append('target_month', String(target_month));
    }

    const qs = params.toString();
    const url = `${BASE_URL}/branch-admin/monthly-targets${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders('branch_manager'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch monthly targets', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.getBranchAdminMonthlyTargets error:', error);
    throw error;
  }
}

// ==========================================
// STAFF MONTHLY TARGETS API (Collection Agent & Staff)
// ==========================================

/**
 * GET /staff/monthly-targets/me?target_month=YYYY-MM-01 - Get target for current staff member
 */
export async function getStaffMonthlyTargetsMe({ target_month } = {}) {
  try {
    const params = new URLSearchParams();
    if (target_month) {
      params.append('target_month', String(target_month));
    }

    const qs = params.toString();
    const url = `${BASE_URL}/staff/monthly-targets/me${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch staff personal monthly target', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('monthlyTargetService.getStaffMonthlyTargetsMe error:', error);
    throw error;
  }
}

const monthlyTargetService = {
  getSuperAdminBranchAdmins,
  getSuperAdminTargetRoles,
  createSuperAdminMonthlyTarget,
  getSuperAdminMonthlyTargets,
  getBranchAdminStaffList,
  createBranchAdminStaffTarget,
  getBranchAdminMonthlyTargets,
  getStaffMonthlyTargetsMe,
};

export default monthlyTargetService;
