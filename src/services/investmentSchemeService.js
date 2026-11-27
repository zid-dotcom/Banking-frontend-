// Investment Schemes API service connecting to backend superadmin, branch-admin, and member endpoints
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Helper to get standard headers across Super Admin, Branch Admin, and Member roles
 */
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('superadmin_token') ||
    localStorage.getItem('branch_token') ||
    localStorage.getItem('member_token') ||
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

  const targetPath =
    role === 'member'
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
// SUPERADMIN INVESTMENT SCHEMES API
// ==========================================

/**
 * 1. GET /superadmin/investment-schemes - List schemes with filters
 * Supports: skip, limit, is_active, frequency (daily, weekly, monthly), search
 */
export async function getSuperAdminInvestmentSchemes({
  skip = 0,
  limit = 100,
  is_active,
  frequency,
  search,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (is_active !== undefined && is_active !== null && is_active !== 'all') {
      params.append('is_active', String(is_active));
    }
    if (frequency && frequency !== 'all') {
      params.append('frequency', String(frequency).toLowerCase());
    }
    if (search && String(search).trim()) {
      params.append('search', String(search).trim());
    }

    const qs = params.toString();
    const url = `${BASE_URL}/superadmin/investment-schemes${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch investment schemes', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('investmentSchemeService.getSuperAdminInvestmentSchemes error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/investment-schemes/{scheme_id} - Get single scheme
 */
export async function getSuperAdminInvestmentScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/investment-schemes/${schemeId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch investment scheme #${schemeId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`investmentSchemeService.getSuperAdminInvestmentScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/investment-schemes - Create investment scheme
 * Request body:
 * {
 *   "scheme_name": "string",
 *   "scheme_code": "string",
 *   "contribution_frequency": "daily" | "weekly" | "monthly",
 *   "installment_amount": 1,
 *   "tenure_installments": 1,
 *   "annual_interest_rate": 100,
 *   "description": "string",
 *   "is_active": true
 * }
 */
export async function createSuperAdminInvestmentScheme(payload) {
  try {
    const bodyData = {
      scheme_name: String(payload.scheme_name || '').trim(),
      scheme_code: String(payload.scheme_code || '').trim().toUpperCase(),
      contribution_frequency: String(payload.contribution_frequency || 'daily').toLowerCase(),
      installment_amount: Number(payload.installment_amount),
      tenure_installments: parseInt(payload.tenure_installments, 10),
      annual_interest_rate: Number(payload.annual_interest_rate),
      description: String(payload.description || '').trim(),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
    };

    const res = await fetch(`${BASE_URL}/superadmin/investment-schemes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create investment scheme', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('investmentSchemeService.createSuperAdminInvestmentScheme error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/investment-schemes/{scheme_id} - Update investment scheme
 */
export async function updateSuperAdminInvestmentScheme(schemeId, payload) {
  try {
    const bodyData = {
      scheme_name: String(payload.scheme_name || '').trim(),
      scheme_code: String(payload.scheme_code || '').trim().toUpperCase(),
      contribution_frequency: String(payload.contribution_frequency || 'daily').toLowerCase(),
      installment_amount: Number(payload.installment_amount),
      tenure_installments: parseInt(payload.tenure_installments, 10),
      annual_interest_rate: Number(payload.annual_interest_rate),
      description: String(payload.description || '').trim(),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
    };

    const res = await fetch(`${BASE_URL}/superadmin/investment-schemes/${schemeId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update investment scheme #${schemeId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`investmentSchemeService.updateSuperAdminInvestmentScheme(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 5. PATCH /superadmin/investment-schemes/{scheme_id}/status - Toggle Scheme Active Status
 */
export async function changeSuperAdminInvestmentSchemeStatus(schemeId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/investment-schemes/${schemeId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update status for scheme #${schemeId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`investmentSchemeService.changeSuperAdminInvestmentSchemeStatus(${schemeId}) error:`, error);
    throw error;
  }
}

/**
 * 6. DELETE /superadmin/investment-schemes/{scheme_id} - Soft-delete Scheme
 */
export async function deleteSuperAdminInvestmentScheme(schemeId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/investment-schemes/${schemeId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete investment scheme #${schemeId}`, 'super_admin');
    }

    return true;
  } catch (error) {
    console.error(`investmentSchemeService.deleteSuperAdminInvestmentScheme(${schemeId}) error:`, error);
    throw error;
  }
}

// ==========================================
// BRANCH ADMIN INVESTMENT SCHEMES API
// ==========================================

/**
 * 7. GET /branch-admin/investment-schemes - List active schemes
 * Supports: ?frequency=monthly | weekly | daily
 */
export async function getBranchAdminInvestmentSchemes({ frequency, search } = {}) {
  try {
    const params = new URLSearchParams();
    if (frequency && frequency !== 'all') {
      params.append('frequency', String(frequency).toLowerCase());
    }
    if (search && String(search).trim()) {
      params.append('search', String(search).trim());
    }

    const qs = params.toString();
    const url = `${BASE_URL}/branch-admin/investment-schemes${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch investment schemes', 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error('investmentSchemeService.getBranchAdminInvestmentSchemes error:', error);
    throw error;
  }
}

// ==========================================
// MEMBER INVESTMENT SCHEMES API
// ==========================================

/**
 * 8. GET /member/investment-schemes - List active schemes
 * Supports: ?frequency=monthly | weekly | daily
 */
export async function getMemberInvestmentSchemes({ frequency, search } = {}) {
  try {
    const params = new URLSearchParams();
    if (frequency && frequency !== 'all') {
      params.append('frequency', String(frequency).toLowerCase());
    }
    if (search && String(search).trim()) {
      params.append('search', String(search).trim());
    }

    const qs = params.toString();
    const url = `${BASE_URL}/member/investment-schemes${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch member investment schemes', 'member');
    }

    return await res.json();
  } catch (error) {
    console.error('investmentSchemeService.getMemberInvestmentSchemes error:', error);
    throw error;
  }
}

const investmentSchemeService = {
  getSuperAdminInvestmentSchemes,
  getSuperAdminInvestmentScheme,
  createSuperAdminInvestmentScheme,
  updateSuperAdminInvestmentScheme,
  changeSuperAdminInvestmentSchemeStatus,
  deleteSuperAdminInvestmentScheme,
  getBranchAdminInvestmentSchemes,
  getMemberInvestmentSchemes,
};

export default investmentSchemeService;
