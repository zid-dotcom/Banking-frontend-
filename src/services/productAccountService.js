// Product Account & Application API Service (Investment & FD/MIS Schemes)
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

function getBranchAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('branch_token') ||
    localStorage.getItem('branch_manager_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function getStaffHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('staff_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function getSuperAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('superadmin_token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function parseApiError(errBody, status, fallbackMessage = 'Operation failed') {
  if (!errBody) return `${fallbackMessage} (${status || 'Unknown'})`;
  if (typeof errBody === 'string') return errBody;
  if (errBody.detail) {
    if (typeof errBody.detail === 'string') return errBody.detail;
    if (Array.isArray(errBody.detail)) {
      return errBody.detail
        .map((e) => `${e.loc?.filter((l) => l !== 'body').join('.') || 'field'}: ${e.msg}`)
        .join(', ');
    }
  }
  if (errBody.message) return errBody.message;
  return fallbackMessage;
}

/* =========================================================================
   1. MEMBER PRODUCT ACCOUNT REQUESTS APIS
   ========================================================================= */

/**
 * POST /member/product-account-requests
 * Apply for an investment or FD/MIS scheme
 * @param {Object} payload { product_type: 'investment'|'fd_mis', scheme_id, savings_account_id, requested_principal }
 */
export async function createProductAccountRequest(payload) {
  try {
    const res = await fetch(`${BASE_URL}/member/product-account-requests`, {
      method: 'POST',
      headers: getMemberHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to submit scheme application'));
    }

    return await res.json();
  } catch (error) {
    console.error('productAccountService.createProductAccountRequest error:', error);
    throw error;
  }
}

/**
 * GET /member/product-account-requests
 * List the member's submitted scheme applications
 */
export async function getMemberProductAccountRequests({ skip = 0, limit = 50, status = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/product-account-requests${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch scheme applications'));
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.requests)) return data.requests;
    return [];
  } catch (error) {
    console.error('productAccountService.getMemberProductAccountRequests error:', error);
    throw error;
  }
}

/**
 * GET /member/product-account-requests/{request_id}
 */
export async function getMemberProductAccountRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/member/product-account-requests/${requestId}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, `Failed to fetch application #${requestId}`));
    }

    return await res.json();
  } catch (error) {
    console.error(`productAccountService.getMemberProductAccountRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * GET /member/product-accounts
 * List accounts opened after approval
 */
export async function getMemberProductAccounts({ skip = 0, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/product-accounts${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch active product accounts'));
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.accounts)) return data.accounts;
    return [];
  } catch (error) {
    console.error('productAccountService.getMemberProductAccounts error:', error);
    throw error;
  }
}

/* =========================================================================
   2. BRANCH ADMIN PRODUCT ACCOUNT REQUESTS APIS
   ========================================================================= */

/**
 * GET /branch-admin/product-account-requests
 */
export async function getBranchAdminProductAccountRequests({ skip = 0, limit = 50, status = null, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/product-account-requests${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch branch applications'));
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.requests)) return data.requests;
    return [];
  } catch (error) {
    console.error('productAccountService.getBranchAdminProductAccountRequests error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/product-account-requests/{request_id}
 */
export async function getBranchAdminProductAccountRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/product-account-requests/${requestId}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, `Failed to fetch branch application #${requestId}`));
    }

    return await res.json();
  } catch (error) {
    console.error(`productAccountService.getBranchAdminProductAccountRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * PATCH /branch-admin/product-account-requests/{request_id}/decision
 * @param {number} requestId
 * @param {Object} decision { status: 'approved'|'rejected', rejection_reason: string|null }
 */
export async function decideBranchAdminProductAccountRequest(requestId, { status, rejection_reason = null }) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/product-account-requests/${requestId}/decision`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify({
        status,
        rejection_reason: rejection_reason || null,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to submit application decision'));
    }

    return await res.json();
  } catch (error) {
    console.error(`productAccountService.decideBranchAdminProductAccountRequest(${requestId}) error:`, error);
    throw error;
  }
}

/* =========================================================================
   3. BRANCH ADMIN, ACCOUNTANT & SUPERADMIN PRODUCT ACCOUNTS APIS
   ========================================================================= */

/**
 * Branch Admin: GET /branch-admin/investment-accounts
 */
export async function getBranchAdminInvestmentAccounts({ skip = 0, limit = 50, status = null, search = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/investment-accounts${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch branch investment accounts'));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.accounts || []);
  } catch (error) {
    console.error('productAccountService.getBranchAdminInvestmentAccounts error:', error);
    throw error;
  }
}

/**
 * Branch Admin: GET /branch-admin/fd-mis-accounts
 */
export async function getBranchAdminFdMisAccounts({ skip = 0, limit = 50, status = null, search = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/fd-mis-accounts${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch branch FD/MIS accounts'));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.accounts || []);
  } catch (error) {
    console.error('productAccountService.getBranchAdminFdMisAccounts error:', error);
    throw error;
  }
}

/**
 * Accountant: GET /staff/accountant/investment-accounts
 */
export async function getAccountantInvestmentAccounts({ skip = 0, limit = 50, status = null, search = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/accountant/investment-accounts${qs}`, {
      method: 'GET',
      headers: getStaffHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch accountant investment accounts'));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.accounts || []);
  } catch (error) {
    console.error('productAccountService.getAccountantInvestmentAccounts error:', error);
    throw error;
  }
}

/**
 * Accountant: GET /staff/accountant/fd-mis-accounts
 */
export async function getAccountantFdMisAccounts({ skip = 0, limit = 50, status = null, search = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/accountant/fd-mis-accounts${qs}`, {
      method: 'GET',
      headers: getStaffHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch accountant FD/MIS accounts'));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.accounts || []);
  } catch (error) {
    console.error('productAccountService.getAccountantFdMisAccounts error:', error);
    throw error;
  }
}

/**
 * Superadmin, by branch: GET /superadmin/branches/{branch_id}/investment-accounts
 */
export async function getSuperAdminBranchInvestmentAccounts(branchId, { skip = 0, limit = 50, status = null, search = null } = {}) {
  try {
    if (!branchId) throw new Error('Branch ID is required');
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/investment-accounts${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, `Failed to fetch branch #${branchId} investment accounts`));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.accounts || []);
  } catch (error) {
    console.error(`productAccountService.getSuperAdminBranchInvestmentAccounts(${branchId}) error:`, error);
    throw error;
  }
}

/**
 * Superadmin, by branch: GET /superadmin/branches/{branch_id}/fd-mis-accounts
 */
export async function getSuperAdminBranchFdMisAccounts(branchId, { skip = 0, limit = 50, status = null, search = null } = {}) {
  try {
    if (!branchId) throw new Error('Branch ID is required');
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/fd-mis-accounts${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, `Failed to fetch branch #${branchId} FD/MIS accounts`));
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.accounts || []);
  } catch (error) {
    console.error(`productAccountService.getSuperAdminBranchFdMisAccounts(${branchId}) error:`, error);
    throw error;
  }
}

export default {
  createProductAccountRequest,
  getMemberProductAccountRequests,
  getMemberProductAccountRequest,
  getMemberProductAccounts,
  getBranchAdminProductAccountRequests,
  getBranchAdminProductAccountRequest,
  decideBranchAdminProductAccountRequest,
  getBranchAdminInvestmentAccounts,
  getBranchAdminFdMisAccounts,
  getAccountantInvestmentAccounts,
  getAccountantFdMisAccounts,
  getSuperAdminBranchInvestmentAccounts,
  getSuperAdminBranchFdMisAccounts,
};
