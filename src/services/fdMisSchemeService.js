// FD/MIS Schemes API service connecting to backend superadmin endpoints
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
    handleAuthExpired('super_admin');
    throw new Error('Token is expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/fd-mis-schemes - List FD/MIS Schemes
 * Query params: skip, limit, is_active, search
 */
export async function getFdMisSchemes({ skip = 0, limit = 50, is_active, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', skip);
    if (limit !== undefined && limit !== null) params.append('limit', limit);
    if (is_active !== undefined && is_active !== null && is_active !== 'all') {
      params.append('is_active', is_active);
    }
    if (search && search.trim()) params.append('search', search.trim());

    const url = `${BASE_URL}/superadmin/fd-mis-schemes${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch FD/MIS schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('fdMisSchemeService.getFdMisSchemes error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/fd-mis-schemes/{scheme_id} - Get Scheme Details
 */
export async function getFdMisScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/fd-mis-schemes/${schemeId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch FD/MIS scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`fdMisSchemeService.getFdMisScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/fd-mis-schemes - Create FD/MIS Scheme
 */
export async function createFdMisScheme(schemeData) {
  try {
    const payload = {
      scheme_name: schemeData.scheme_name?.trim(),
      scheme_code: schemeData.scheme_code?.trim(),
      minimum_fd_mis_amount: Number(schemeData.minimum_fd_mis_amount) || 0,
      fd_mis_lock_in_period_months: Number(schemeData.fd_mis_lock_in_period_months) || 0,
      annual_interest_rate: Number(schemeData.annual_interest_rate) || 0,
      senior_citizen_addon_interest_rate: Number(schemeData.senior_citizen_addon_interest_rate) || 0,
      interest_lock_in_period_months: Number(schemeData.interest_lock_in_period_months) || 0,
      tenure_value: Number(schemeData.tenure_value) || 1,
      tenure_unit: schemeData.tenure_unit || 'months',
      bonus_rate: Number(schemeData.bonus_rate) || 0,
      bonus_rate_type: schemeData.bonus_rate_type || 'percent',
      cancellation_charges: Number(schemeData.cancellation_charges) || 0,
      cancellation_charges_type: schemeData.cancellation_charges_type || 'fixed',
      penal_charges_percent: Number(schemeData.penal_charges_percent) || 0,
      stationary_charges: Number(schemeData.stationary_charges) || 0,
      interest_payout_type: schemeData.interest_payout_type || 'cumulative_yearly',
      is_active: schemeData.is_active !== undefined ? Boolean(schemeData.is_active) : true,
    };

    const res = await fetch(`${BASE_URL}/superadmin/fd-mis-schemes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create FD/MIS scheme');
    }

    return await res.json();
  } catch (error) {
    console.error('fdMisSchemeService.createFdMisScheme error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/fd-mis-schemes/{scheme_id} - Update FD/MIS Scheme
 */
export async function updateFdMisScheme(schemeId, schemeData) {
  try {
    const payload = {
      scheme_name: schemeData.scheme_name?.trim(),
      scheme_code: schemeData.scheme_code?.trim(),
      minimum_fd_mis_amount: Number(schemeData.minimum_fd_mis_amount) || 0,
      fd_mis_lock_in_period_months: Number(schemeData.fd_mis_lock_in_period_months) || 0,
      annual_interest_rate: Number(schemeData.annual_interest_rate) || 0,
      senior_citizen_addon_interest_rate: Number(schemeData.senior_citizen_addon_interest_rate) || 0,
      interest_lock_in_period_months: Number(schemeData.interest_lock_in_period_months) || 0,
      tenure_value: Number(schemeData.tenure_value) || 1,
      tenure_unit: schemeData.tenure_unit || 'months',
      bonus_rate: Number(schemeData.bonus_rate) || 0,
      bonus_rate_type: schemeData.bonus_rate_type || 'percent',
      cancellation_charges: Number(schemeData.cancellation_charges) || 0,
      cancellation_charges_type: schemeData.cancellation_charges_type || 'fixed',
      penal_charges_percent: Number(schemeData.penal_charges_percent) || 0,
      stationary_charges: Number(schemeData.stationary_charges) || 0,
      interest_payout_type: schemeData.interest_payout_type || 'cumulative_yearly',
      is_active: schemeData.is_active !== undefined ? Boolean(schemeData.is_active) : true,
    };

    const res = await fetch(`${BASE_URL}/superadmin/fd-mis-schemes/${schemeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update FD/MIS scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`fdMisSchemeService.updateFdMisScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /superadmin/fd-mis-schemes/{scheme_id} - Delete FD/MIS Scheme
 */
export async function deleteFdMisScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/fd-mis-schemes/${schemeId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete FD/MIS scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`fdMisSchemeService.deleteFdMisScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /superadmin/fd-mis-schemes/{scheme_id}/status - Change Scheme Status
 */
export async function changeFdMisSchemeStatus(schemeId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/fd-mis-schemes/${schemeId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update status for scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`fdMisSchemeService.changeFdMisSchemeStatus(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 7. GET /branch-admin/fd-mis-schemes - List Available FD/MIS Schemes for Branch Admin
 */
export async function getBranchAdminFdMisSchemes({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const token =
      localStorage.getItem('branch_token') ||
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

    const res = await fetch(`${BASE_URL}/branch-admin/fd-mis-schemes${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to fetch branch FD/MIS schemes');
      throw new Error(msg);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('fdMisSchemeService.getBranchAdminFdMisSchemes error:', error);
    throw error;
  }
}

/**
 * 8. GET /member/fd-mis-schemes - List Available FD/MIS Schemes for Member
 */
export async function getMemberFdMisSchemes({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
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

    const res = await fetch(`${BASE_URL}/member/fd-mis-schemes${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to fetch member FD/MIS schemes');
      throw new Error(msg);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('fdMisSchemeService.getMemberFdMisSchemes error:', error);
    throw error;
  }
}

export default {
  getFdMisSchemes,
  getFdMisScheme,
  createFdMisScheme,
  updateFdMisScheme,
  deleteFdMisScheme,
  changeFdMisSchemeStatus,
  getBranchAdminFdMisSchemes,
  getMemberFdMisSchemes,
  handleAuthExpired,
  parseApiError,
};

