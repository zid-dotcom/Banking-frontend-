// Cash Transactions & Account Lookup API Service connecting Staff, Branch Admin, Super Admin, and Member
import { parseApiError, isTokenExpiredError, handleAuthExpired } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

function getHeaders(role = 'staff') {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  let token = null;
  if (role === 'staff') {
    token =
      localStorage.getItem('staff_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');
  } else if (role === 'branch_admin' || role === 'branch_manager') {
    token =
      localStorage.getItem('branch_token') ||
      localStorage.getItem('branch_admin_token') ||
      localStorage.getItem('branch_manager_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');
  } else if (role === 'super_admin' || role === 'superadmin') {
    token =
      localStorage.getItem('superadmin_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');
  } else if (role === 'member') {
    token =
      localStorage.getItem('member_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');
  }

  if (!token) {
    token = localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function checkResponse(res, errBody, defaultMsg, role = 'staff') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role);
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/* =========================================================================
   1. STAFF / CASHIER CASH OPERATIONS
   ========================================================================= */

/**
 * GET /staff/savings-accounts/lookup?account_number=<16-digit-number>
 * Read-only Cashier lookup. Returns account holder name, scheme, balance,
 * whether deposits or withdrawals are allowed, etc.
 */
export async function lookupSavingsAccount(accountNumber) {
  try {
    if (!accountNumber || !String(accountNumber).trim()) {
      throw new Error('Please enter an account number.');
    }
    const cleanAccount = String(accountNumber).trim();
    if (!/^\d{16}$/.test(cleanAccount)) {
      throw new Error('Wrong account number. Account number must be exactly 16 digits.');
    }
    const res = await fetch(`${BASE_URL}/staff/savings-accounts/lookup?account_number=${encodeURIComponent(cleanAccount)}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      if (res.status === 404) {
        throw new Error('Wrong account number. No account found matching this number.');
      }
      checkResponse(res, errBody, 'Wrong account number. Please check and try again.', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashTransactionService.lookupSavingsAccount error:', error);
    throw error;
  }
}

/**
 * POST /staff/cash-deposits
 * Body: { "account_number": "...", "amount": 100.00, "notes": "..." }
 */
export async function createCashDeposit({ account_number, amount, notes = '' }) {
  try {
    const payload = {
      account_number: String(account_number).trim(),
      amount: Number(amount),
    };
    if (notes && String(notes).trim()) {
      payload.notes = String(notes).trim();
    }

    const res = await fetch(`${BASE_URL}/staff/cash-deposits`, {
      method: 'POST',
      headers: getHeaders('staff'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Cash deposit failed. Please verify account status and amount.', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashTransactionService.createCashDeposit error:', error);
    throw error;
  }
}

/**
 * POST /staff/cash-withdrawals
 * Body: { "account_number": "...", "amount": 100.00, "notes": "..." }
 */
export async function createCashWithdrawal({ account_number, amount, notes = '' }) {
  try {
    const payload = {
      account_number: String(account_number).trim(),
      amount: Number(amount),
    };
    if (notes && String(notes).trim()) {
      payload.notes = String(notes).trim();
    }

    const res = await fetch(`${BASE_URL}/staff/cash-withdrawals`, {
      method: 'POST',
      headers: getHeaders('staff'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Cash withdrawal failed. Please verify withdrawable balance and account status.', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashTransactionService.createCashWithdrawal error:', error);
    throw error;
  }
}

/**
 * GET /staff/cash-transactions
 * Cashier sees only their own cash transactions
 */
export async function getStaffCashTransactions(options = {}) {
  try {
    const opts = options || {};
    const skip = opts.skip ?? 0;
    const limit = opts.limit ?? 100;
    const search = opts.search ?? '';
    const from_date = opts.from_date || opts.fromDate || '';
    const to_date = opts.to_date || opts.toDate || '';
    const account_number = opts.account_number || '';

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    // Backend requires both from_date and to_date together for a date range query
    if (from_date && to_date && String(from_date).trim() && String(to_date).trim()) {
      params.append('from_date', String(from_date).trim());
      params.append('to_date', String(to_date).trim());
    }
    if (account_number && String(account_number).trim()) params.append('account_number', String(account_number).trim());
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/cash-transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch cashier transactions', 'staff');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.transactions)) return data.transactions;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('cashTransactionService.getStaffCashTransactions error:', error);
    throw error;
  }
}

/* =========================================================================
   2. BRANCH ADMIN / BRANCH MANAGER CASH TRANSACTIONS
   ========================================================================= */

/**
 * GET /branch-admin/cash-transactions
 * Branch Admin sees transactions from their branch
 */
export async function getBranchAdminCashTransactions(options = {}) {
  try {
    const opts = options || {};
    const skip = opts.skip ?? 0;
    const limit = opts.limit ?? 100;
    const search = opts.search ?? '';
    const from_date = opts.from_date || opts.fromDate || '';
    const to_date = opts.to_date || opts.toDate || '';
    const account_number = opts.account_number || '';
    const staff_user_id = opts.staff_user_id ?? null;

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    // Backend requires both from_date and to_date together for a date range query
    if (from_date && to_date && String(from_date).trim() && String(to_date).trim()) {
      params.append('from_date', String(from_date).trim());
      params.append('to_date', String(to_date).trim());
    }
    if (account_number && String(account_number).trim()) params.append('account_number', String(account_number).trim());
    if (staff_user_id && staff_user_id !== 'all') params.append('staff_user_id', String(staff_user_id));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/cash-transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('branch_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch branch cash transactions', 'branch_admin');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.transactions)) return data.transactions;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('cashTransactionService.getBranchAdminCashTransactions error:', error);
    throw error;
  }
}

/* =========================================================================
   3. SUPER ADMIN CENTRAL CASH TRANSACTIONS
   ========================================================================= */

/**
 * GET /superadmin/cash-transactions?branch_id=...
 * Superadmin can filter across branches or view all society cash transactions
 */
export async function getSuperAdminCashTransactions(options = {}) {
  try {
    let branch_id = null;
    let skip = 0;
    let limit = 100;
    let search = '';
    let from_date = '';
    let to_date = '';
    let account_number = '';
    let staff_user_id = null;

    if (options && typeof options === 'object') {
      branch_id = options.branch_id ?? null;
      skip = options.skip ?? 0;
      limit = options.limit ?? 100;
      search = options.search ?? '';
      from_date = options.from_date || options.fromDate || '';
      to_date = options.to_date || options.toDate || '';
      account_number = options.account_number || '';
      staff_user_id = options.staff_user_id ?? null;
    } else if (typeof options === 'string' || typeof options === 'number') {
      branch_id = options;
    }

    const params = new URLSearchParams();
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    // Backend requires both from_date and to_date together for a date range query
    if (from_date && to_date && String(from_date).trim() && String(to_date).trim()) {
      params.append('from_date', String(from_date).trim());
      params.append('to_date', String(to_date).trim());
    }
    if (account_number && String(account_number).trim()) params.append('account_number', String(account_number).trim());
    if (staff_user_id && staff_user_id !== 'all') params.append('staff_user_id', String(staff_user_id));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/cash-transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch central cash transactions', 'super_admin');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.transactions)) return data.transactions;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('cashTransactionService.getSuperAdminCashTransactions error:', error);
    throw error;
  }
}

/* =========================================================================
   4. MEMBER SAVINGS ACCOUNT TRANSACTIONS
   ========================================================================= */

/**
 * GET /member/savings-accounts/{account_id}/transactions
 * Members see their account transaction history
 */
export async function getMemberSavingsAccountTransactions(accountId, options = {}) {
  try {
    if (!accountId) throw new Error('Account ID is required to fetch transactions.');
    const opts = options || {};
    const skip = opts.skip ?? 0;
    const limit = opts.limit ?? 100;
    const from_date = opts.from_date || opts.fromDate || '';
    const to_date = opts.to_date || opts.toDate || '';

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (from_date && to_date && String(from_date).trim() && String(to_date).trim()) {
      params.append('from_date', String(from_date).trim());
      params.append('to_date', String(to_date).trim());
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/savings-accounts/${accountId}/transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('member'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, `Failed to fetch transactions for account #${accountId}`, 'member');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.transactions)) return data.transactions;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error(`cashTransactionService.getMemberSavingsAccountTransactions(${accountId}) error:`, error);
    throw error;
  }
}

/* =========================================================================
   5. MEMBER CASH TRANSACTIONS (BRANCH ADMIN & SUPER ADMIN)
   ========================================================================= */

/**
 * GET /branch-admin/members/{member_id}/cash-transactions
 * Params: member_id (path), from_date, to_date, skip, limit
 */
export async function getBranchAdminMemberCashTransactions(memberId, options = {}) {
  try {
    if (!memberId) throw new Error('Member ID is required to fetch transactions.');
    const opts = options || {};
    const skip = opts.skip ?? 0;
    const limit = opts.limit ?? 100;
    const from_date = opts.from_date || opts.fromDate || '';
    const to_date = opts.to_date || opts.toDate || '';

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    if (from_date && to_date) {
      params.append('from_date', String(from_date).trim());
      params.append('to_date', String(to_date).trim());
    } else if (from_date || to_date) {
      const singleDate = String(from_date || to_date).trim();
      params.append('from_date', singleDate);
      params.append('to_date', singleDate);
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/members/${encodeURIComponent(memberId)}/cash-transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('branch_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, `Failed to fetch cash transactions for member #${memberId}`, 'branch_admin');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`cashTransactionService.getBranchAdminMemberCashTransactions(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * GET /superadmin/branches/{branch_id}/members/{member_id}/cash-transactions
 * Params: branch_id (path), member_id (path), from_date, to_date, skip, limit
 */
export async function getSuperAdminMemberCashTransactions(branchId, memberId, options = {}) {
  try {
    if (!branchId) throw new Error('Branch ID is required to fetch transactions.');
    if (!memberId) throw new Error('Member ID is required to fetch transactions.');
    const opts = options || {};
    const skip = opts.skip ?? 0;
    const limit = opts.limit ?? 100;
    const from_date = opts.from_date || opts.fromDate || '';
    const to_date = opts.to_date || opts.toDate || '';

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    if (from_date && to_date) {
      params.append('from_date', String(from_date).trim());
      params.append('to_date', String(to_date).trim());
    } else if (from_date || to_date) {
      const singleDate = String(from_date || to_date).trim();
      params.append('from_date', singleDate);
      params.append('to_date', singleDate);
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/branches/${encodeURIComponent(branchId)}/members/${encodeURIComponent(memberId)}/cash-transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, `Failed to fetch cash transactions for member #${memberId} at branch #${branchId}`, 'super_admin');
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`cashTransactionService.getSuperAdminMemberCashTransactions(branch=${branchId}, member=${memberId}) error:`, error);
    throw error;
  }
}

// Re-export Accountant member cash transactions
export { getAccountantMemberCashTransactions } from './accountantMemberService';

