// Loan Schemes API service connecting to backend superadmin loan schemes endpoints
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
    throw new Error('Token is expired or unauthorized. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/loan-schemes - List Loan Schemes
 */
export async function getLoanSchemes() {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/loan-schemes`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch loan schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch (error) {
    console.error('loanSchemeService.getLoanSchemes error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/loan-schemes/{scheme_id} - Get Loan Scheme details
 */
export async function getLoanScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/loan-schemes/${schemeId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch loan scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`loanSchemeService.getLoanScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/loan-schemes - Create Loan Scheme
 */
export async function createLoanScheme(schemeData) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/loan-schemes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(schemeData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create loan scheme');
    }

    return await res.json();
  } catch (error) {
    console.error('loanSchemeService.createLoanScheme error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/loan-schemes/{scheme_id} - Update Loan Scheme
 */
export async function updateLoanScheme(schemeId, schemeData) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/loan-schemes/${schemeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(schemeData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update loan scheme #${schemeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`loanSchemeService.updateLoanScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /superadmin/loan-schemes/{scheme_id} - Delete Loan Scheme
 */
export async function deleteLoanScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/loan-schemes/${schemeId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete loan scheme #${schemeId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`loanSchemeService.deleteLoanScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /superadmin/loan-schemes/{scheme_id}/status - Change Loan Scheme Status
 * Sends both in body and query param to accommodate varying backend schema expectations
 */
export async function changeLoanSchemeStatus(schemeId, isActive) {
  try {
    const boolValue = Boolean(isActive);
    const res = await fetch(
      `${BASE_URL}/superadmin/loan-schemes/${schemeId}/status?is_active=${boolValue}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_active: boolValue }),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update loan scheme status #${schemeId}`);
    }

    return await res.json().catch(() => ({ is_active: boolValue }));
  } catch (error) {
    console.error(`loanSchemeService.changeLoanSchemeStatus(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 7. GET /branch-admin/loan-schemes - List Available Loan Schemes for Branch Admin
 * Schema matches: Array of LoanSchemeOut objects
 */
export async function getBranchAdminLoanSchemes({ skip = 0, limit = 50, search = '' } = {}) {
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

    const res = await fetch(`${BASE_URL}/branch-admin/loan-schemes${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to fetch branch loan schemes');
      throw new Error(msg);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('loanSchemeService.getBranchAdminLoanSchemes error:', error);
    throw error;
  }
}

/**
 * 8. GET /member/loan-schemes - List Available Loan Schemes for Member
 */
export async function getMemberLoanSchemes({ skip = 0, limit = 50, search = '' } = {}) {
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

    const res = await fetch(`${BASE_URL}/member/loan-schemes${qs}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to fetch member loan schemes');
      throw new Error(msg);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('loanSchemeService.getMemberLoanSchemes error:', error);
    throw error;
  }
}

