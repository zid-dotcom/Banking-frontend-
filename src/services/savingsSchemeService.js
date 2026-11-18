// Savings Schemes API service connecting to backend superadmin savings schemes endpoints
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
  localStorage.removeItem('branch_token');
  localStorage.removeItem('branch_user');
  localStorage.removeItem('branch_manager_user');
  localStorage.removeItem('member_token');
  localStorage.removeItem('member_user');
  localStorage.removeItem('auth_token');
  sessionStorage.setItem('auth_expired_message', 'Token is expired. Please login again.');

  const targetPath = role === 'member'
    ? '/member-login?expired=true'
    : role === 'branch_manager'
    ? '/branch-manager-login?expired=true'
    : '/super-admin/login?expired=true';

  const isAlreadyOnLogin =
    window.location.pathname === '/member-login' ||
    window.location.pathname === '/member/login' ||
    window.location.pathname === '/branch-manager-login' ||
    window.location.pathname === '/super-admin/login';

  if (!isAlreadyOnLogin) {
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
    } else if (window.location.pathname.startsWith('/branch-manager/') || window.location.pathname.startsWith('/branch-admin/')) {
      handleAuthExpired('branch_manager');
    } else if (window.location.pathname.startsWith('/member/')) {
      handleAuthExpired('member');
    } else {
      handleAuthExpired('branch_manager');
    }
    throw new Error('Token is expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/savings-schemes - List Savings Schemes
 * Query params: skip, limit, is_active, search
 */
export async function getSavingsSchemes({ skip = 0, limit = 50, is_active, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', skip);
    if (limit !== undefined && limit !== null) params.append('limit', limit);
    if (is_active !== undefined && is_active !== null && is_active !== 'all') {
      params.append('is_active', is_active);
    }
    if (search && search.trim()) params.append('search', search.trim());

    const url = `${BASE_URL}/superadmin/savings-schemes${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch savings schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsSchemeService.getSavingsSchemes error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/savings-schemes/{scheme_id} - Get Scheme Details
 */
export async function getSavingsScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/savings-schemes/${schemeId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch savings scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`savingsSchemeService.getSavingsScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/savings-schemes - Create Savings Scheme
 */
export async function createSavingsScheme(schemeData) {
  try {
    const payload = {
      scheme_name: schemeData.scheme_name?.trim(),
      scheme_code: schemeData.scheme_code?.trim(),
      min_opening_balance: Number(schemeData.min_opening_balance) || 0,
      min_monthly_avg_balance: Number(schemeData.min_monthly_avg_balance) || 0,
      annual_interest_rate: Number(schemeData.annual_interest_rate) || 0,
      senior_citizen_addon_interest_rate: Number(schemeData.senior_citizen_addon_interest_rate) || 0,
      interest_payout_type: schemeData.interest_payout_type || 'monthly',
      lock_in_amount: Number(schemeData.lock_in_amount) || 0,
      min_monthly_avg_balance_charge: Number(schemeData.min_monthly_avg_balance_charge) || 0,
      service_charge_frequency: schemeData.service_charge_frequency || 'monthly',
      service_charges: Number(schemeData.service_charges) || 0,
      sms_charge_frequency: schemeData.sms_charge_frequency || 'monthly',
      sms_charges: Number(schemeData.sms_charges) || 0,
      is_active: schemeData.is_active !== undefined ? Boolean(schemeData.is_active) : true,
    };

    const res = await fetch(`${BASE_URL}/superadmin/savings-schemes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create savings scheme');
    }

    return await res.json();
  } catch (error) {
    console.error('savingsSchemeService.createSavingsScheme error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/savings-schemes/{scheme_id} - Update Savings Scheme
 */
export async function updateSavingsScheme(schemeId, schemeData) {
  try {
    const payload = {
      scheme_name: schemeData.scheme_name?.trim(),
      scheme_code: schemeData.scheme_code?.trim(),
      min_opening_balance: Number(schemeData.min_opening_balance) || 0,
      min_monthly_avg_balance: Number(schemeData.min_monthly_avg_balance) || 0,
      annual_interest_rate: Number(schemeData.annual_interest_rate) || 0,
      senior_citizen_addon_interest_rate: Number(schemeData.senior_citizen_addon_interest_rate) || 0,
      interest_payout_type: schemeData.interest_payout_type || 'monthly',
      lock_in_amount: Number(schemeData.lock_in_amount) || 0,
      min_monthly_avg_balance_charge: Number(schemeData.min_monthly_avg_balance_charge) || 0,
      service_charge_frequency: schemeData.service_charge_frequency || 'monthly',
      service_charges: Number(schemeData.service_charges) || 0,
      sms_charge_frequency: schemeData.sms_charge_frequency || 'monthly',
      sms_charges: Number(schemeData.sms_charges) || 0,
      is_active: schemeData.is_active !== undefined ? Boolean(schemeData.is_active) : true,
    };

    const res = await fetch(`${BASE_URL}/superadmin/savings-schemes/${schemeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update savings scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`savingsSchemeService.updateSavingsScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /superadmin/savings-schemes/{scheme_id} - Delete Savings Scheme
 */
export async function deleteSavingsScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/savings-schemes/${schemeId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete savings scheme #${schemeId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`savingsSchemeService.deleteSavingsScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /superadmin/savings-schemes/{scheme_id}/status - Toggle Active Status
 */
export async function changeSavingsSchemeStatus(schemeId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/savings-schemes/${schemeId}/status`, {
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
    console.error(`savingsSchemeService.changeSavingsSchemeStatus(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 7. GET /branch-admin/savings-schemes - List Available Savings Schemes for Branch Admin
 */
export async function getBranchAdminSavingsSchemes({ skip = 0, limit = 50, search = '' } = {}) {
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

    const res = await fetch(`${BASE_URL}/branch-admin/savings-schemes${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch savings schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsSchemeService.getBranchAdminSavingsSchemes error:', error);
    throw error;
  }
}

/**
 * 8. GET /member/savings-schemes - List Available Savings Schemes for Member
 */
export async function getMemberSavingsSchemes({ skip = 0, limit = 50, search = '' } = {}) {
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

    const res = await fetch(`${BASE_URL}/member/savings-schemes${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch member savings schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsSchemeService.getMemberSavingsSchemes error:', error);
    throw error;
  }
}

// Re-export all Savings Account and Request APIs
export * from './savingsAccountService';

