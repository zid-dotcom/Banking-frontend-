import { parseApiError, handleAuthExpired } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Standard token resolution for API calls
 */
function getHeaders(role = 'branch_manager') {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  let token = null;
  if (role === 'super_admin') {
    token =
      localStorage.getItem('superadmin_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');
  } else {
    token =
      localStorage.getItem('branch_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('branch_manager_token') ||
      localStorage.getItem('auth_token');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function checkResponseStatus(res, errBody, defaultMsg, role = 'branch_manager') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  const isExpired =
    res.status === 401 ||
    parsedMsg.toLowerCase().includes('expired token') ||
    parsedMsg.toLowerCase().includes('invalid or expired') ||
    parsedMsg.toLowerCase().includes('token has expired');

  if (isExpired) {
    handleAuthExpired(role);
    throw new Error('Your session has expired. Please log in again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /branch-admin/overview
 * Current authenticated branch admin overview
 * Query params:
 *  - from_date (YYYY-MM-DD)
 *  - to_date (YYYY-MM-DD)
 *  - enquiries_skip (int)
 *  - enquiries_limit (int)
 */
export async function getBranchAdminOverview({
  from_date = null,
  to_date = null,
  enquiries_skip = 0,
  enquiries_limit = 20,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (from_date && to_date) {
      params.append('from_date', from_date);
      params.append('to_date', to_date);
    }
    if (enquiries_skip !== undefined && enquiries_skip !== null) {
      params.append('enquiries_skip', String(enquiries_skip));
    }
    if (enquiries_limit !== undefined && enquiries_limit !== null) {
      params.append('enquiries_limit', String(enquiries_limit));
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/overview${qs}`, {
      method: 'GET',
      headers: getHeaders('branch_manager'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch overview', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error('branchOverviewService.getBranchAdminOverview error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/branch-overview
 * Super Admin apex branch overviews
 * Query params:
 *  - branch_id (int, optional)
 *  - from_date (YYYY-MM-DD)
 *  - to_date (YYYY-MM-DD)
 *  - skip (int)
 *  - limit (int)
 *  - enquiries_skip (int)
 *  - enquiries_limit (int)
 */
export async function getSuperAdminBranchOverview({
  branch_id = null,
  from_date = null,
  to_date = null,
  skip = 0,
  limit = 100,
  enquiries_skip = 0,
  enquiries_limit = 20,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (branch_id && branch_id !== 'all') {
      params.append('branch_id', String(branch_id));
    }
    if (from_date && to_date) {
      params.append('from_date', from_date);
      params.append('to_date', to_date);
    }
    if (skip !== undefined && skip !== null) {
      params.append('skip', String(skip));
    }
    if (limit !== undefined && limit !== null) {
      params.append('limit', String(limit));
    }
    if (enquiries_skip !== undefined && enquiries_skip !== null) {
      params.append('enquiries_skip', String(enquiries_skip));
    }
    if (enquiries_limit !== undefined && enquiries_limit !== null) {
      params.append('enquiries_limit', String(enquiries_limit));
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/branch-overview${qs}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch superadmin branch overview', 'super_admin');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data ? [data] : []);
  } catch (error) {
    console.error('branchOverviewService.getSuperAdminBranchOverview error:', error);
    throw error;
  }
}
