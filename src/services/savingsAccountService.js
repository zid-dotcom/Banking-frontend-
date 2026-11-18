import { handleAuthExpired, isTokenExpiredError, parseApiError } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Super Admin headers helper
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
 * Branch Admin / Branch Manager headers helper
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
 * Member headers helper
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

function checkRequestStatus(res, errBody, defaultMsg, role = null) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role);
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/* =========================================================================
   1. MEMBER SAVINGS ACCOUNTS & REQUESTS APIS
   ========================================================================= */

/**
 * POST /member/savings-account-requests
 * Body: { "savings_scheme_id": number }
 */
export async function createMemberSavingsAccountRequest({ savings_scheme_id }) {
  try {
    const res = await fetch(`${BASE_URL}/member/savings-account-requests`, {
      method: 'POST',
      headers: getMemberHeaders(),
      body: JSON.stringify({ savings_scheme_id: Number(savings_scheme_id) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to submit savings account request', 'member');
    }

    return await res.json();
  } catch (error) {
    console.error('savingsAccountService.createMemberSavingsAccountRequest error:', error);
    throw error;
  }
}

/**
 * GET /member/savings-account-requests
 * Lists all savings account opening requests submitted by this member
 */
export async function getMemberSavingsAccountRequests({ skip = 0, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/savings-account-requests${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch member savings account requests', 'member');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.requests)) return data.requests;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsAccountService.getMemberSavingsAccountRequests error:', error);
    throw error;
  }
}

/**
 * GET /member/savings-accounts
 * Lists all active/opened savings accounts belonging to the member
 */
export async function getMemberSavingsAccounts({ skip = 0, limit = 50 } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/savings-accounts${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch member savings accounts', 'member');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.accounts)) return data.accounts;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsAccountService.getMemberSavingsAccounts error:', error);
    throw error;
  }
}

/* =========================================================================
   2. BRANCH ADMIN SAVINGS ACCOUNTS & REQUESTS APIS
   ========================================================================= */

/**
 * GET /branch-admin/savings-account-requests?status=pending (or all, approved, rejected)
 */
export async function getBranchAdminSavingsAccountRequests({ status = null, skip = 0, limit = 100 } = {}) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', String(status));
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/savings-account-requests${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch branch savings account requests', 'branch_manager');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.requests)) return data.requests;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsAccountService.getBranchAdminSavingsAccountRequests error:', error);
    throw error;
  }
}

/**
 * PATCH /branch-admin/savings-account-requests/{request_id}/decision
 * Body: { "status": "approved" } OR { "status": "rejected", "rejection_reason": "string" }
 */
export async function decideBranchSavingsAccountRequest(requestId, { status, rejection_reason = null }) {
  try {
    const payload = { status };
    if (status === 'rejected' && rejection_reason) {
      payload.rejection_reason = rejection_reason.trim();
    }

    const res = await fetch(`${BASE_URL}/branch-admin/savings-account-requests/${requestId}/decision`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to update decision for request #${requestId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`savingsAccountService.decideBranchSavingsAccountRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * GET /branch-admin/savings-accounts
 * Lists all savings accounts in the branch manager's branch
 */
export async function getBranchAdminSavingsAccounts({ skip = 0, limit = 100, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/savings-accounts${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch branch savings accounts', 'branch_manager');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.accounts)) return data.accounts;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsAccountService.getBranchAdminSavingsAccounts error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/savings-accounts/{account_id}
 * Gets specific savings account details within the branch
 */
export async function getBranchAdminSavingsAccount(accountId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/savings-accounts/${accountId}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to fetch savings account #${accountId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`savingsAccountService.getBranchAdminSavingsAccount(${accountId}) error:`, error);
    throw error;
  }
}

/* =========================================================================
   3. SUPER ADMIN SAVINGS ACCOUNTS APIS
   ========================================================================= */

/**
 * GET /superadmin/savings-accounts?branch_id=3
 * The branch_id filter is optional
 */
export async function getSuperAdminSavingsAccounts({ branch_id = null, skip = 0, limit = 100, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/savings-accounts${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch superadmin savings accounts', 'super_admin');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.accounts)) return data.accounts;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('savingsAccountService.getSuperAdminSavingsAccounts error:', error);
    throw error;
  }
}

/**
 * GET /superadmin/savings-accounts/{account_id}?branch_id=3
 * The branch_id filter is optional
 */
export async function getSuperAdminSavingsAccount(accountId, { branch_id = null } = {}) {
  try {
    const params = new URLSearchParams();
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/savings-accounts/${accountId}${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to fetch savings account #${accountId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`savingsAccountService.getSuperAdminSavingsAccount(${accountId}) error:`, error);
    throw error;
  }
}

/**
 * Re-export member savings account transactions from cashTransactionService
 */
export { getMemberSavingsAccountTransactions } from './cashTransactionService';

