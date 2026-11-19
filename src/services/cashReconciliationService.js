// Cash Reconciliation API Service connecting Staff (Cashier), Accountant, and Branch Admin
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
   1. CASHIER CASH RECONCILIATION
   ========================================================================= */

/**
 * GET /staff/cash-reconciliation
 * List my cash days (filtered by optional business_date, skip, limit)
 */
export async function getStaffCashDays(options = {}) {
  try {
    const opts = options || {};
    const skip = opts.skip ?? 0;
    const limit = opts.limit ?? 20;
    const businessDate = opts.business_date ?? null;

    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (businessDate) params.append('business_date', String(businessDate));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/cash-reconciliation${qs}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch cash reconciliation days', 'staff');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('cashReconciliationService.getStaffCashDays error:', error);
    throw error;
  }
}

/**
 * POST /staff/cash-reconciliation/open
 * Cashier opens the day and records drawer's starting cash
 * Body: { business_date: "YYYY-MM-DD", opening_cash: "5000.00" }
 */
export async function openStaffCashDay({ business_date, opening_cash }) {
  try {
    const payload = {
      business_date: String(business_date).trim(),
      opening_cash: String(opening_cash).trim(),
    };

    const res = await fetch(`${BASE_URL}/staff/cash-reconciliation/open`, {
      method: 'POST',
      headers: getHeaders('staff'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to open cash day', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.openStaffCashDay error:', error);
    throw error;
  }
}

/**
 * POST /staff/cash-reconciliation/close
 * Cashier closes the day with physical cash count
 * Body: { closing_cash: "11900.00" }
 */
export async function closeStaffCashDay({ closing_cash }) {
  try {
    const payload = {
      closing_cash: String(closing_cash).trim(),
    };

    const res = await fetch(`${BASE_URL}/staff/cash-reconciliation/close`, {
      method: 'POST',
      headers: getHeaders('staff'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to close cash day', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.closeStaffCashDay error:', error);
    throw error;
  }
}

/**
 * Helper to fetch the latest cash day and detect if drawer is currently open
 */
export async function getCurrentCashDayStatus() {
  try {
    const days = await getStaffCashDays({ limit: 5 });
    if (!days || days.length === 0) {
      return { isOpen: false, currentDay: null };
    }
    // Check for an actively open day
    const openDay = days.find((d) => String(d.status).toLowerCase() === 'open');
    if (openDay) {
      return { isOpen: true, currentDay: openDay };
    }
    return { isOpen: false, currentDay: days[0] };
  } catch (err) {
    console.warn('getCurrentCashDayStatus warning:', err);
    return { isOpen: false, currentDay: null, error: err.message };
  }
}

/* =========================================================================
   2. ACCOUNTANT & BRANCH ADMIN RECONCILIATIONS
   ========================================================================= */

/**
 * GET /staff/accountant/cash-reconciliations
 * Query params: skip, limit, business_date, from_date, to_date, status
 */
export async function listAccountantCashReconciliations(options = {}) {
  try {
    const opts = options || {};
    const params = new URLSearchParams();
    if (opts.skip !== undefined && opts.skip !== null) params.append('skip', String(opts.skip));
    if (opts.limit !== undefined && opts.limit !== null) params.append('limit', String(opts.limit));
    if (opts.business_date) params.append('business_date', String(opts.business_date).trim());
    if (opts.from_date) params.append('from_date', String(opts.from_date).trim());
    if (opts.to_date) params.append('to_date', String(opts.to_date).trim());
    if (opts.status && opts.status !== 'all') params.append('status', String(opts.status).trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/accountant/cash-reconciliations${qs}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch accountant reconciliations', 'staff');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('cashReconciliationService.listAccountantCashReconciliations error:', error);
    throw error;
  }
}

/**
 * GET /staff/accountant/cash-reconciliations/{report_id}
 * Detailed report including transaction receipts and before/after balances
 */
export async function getAccountantCashReconciliation(reportId) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    const res = await fetch(`${BASE_URL}/staff/accountant/cash-reconciliations/${encodeURIComponent(reportId)}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch accountant reconciliation details', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.getAccountantCashReconciliation error:', error);
    throw error;
  }
}

/**
 * PATCH /staff/accountant/cash-reconciliations/{report_id}/review
 * Schema: CashReconciliationReviewIn { explanation: string | null }
 */
export async function reviewAccountantCashReconciliation(reportId, { explanation }) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    const payload = {
      explanation: explanation !== undefined && explanation !== null ? String(explanation).trim() : null
    };

    const res = await fetch(`${BASE_URL}/staff/accountant/cash-reconciliations/${encodeURIComponent(reportId)}/review`, {
      method: 'PATCH',
      headers: getHeaders('staff'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to review cash reconciliation', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.reviewAccountantCashReconciliation error:', error);
    throw error;
  }
}

/* =========================================================================
   3. BRANCH ADMIN CASH RECONCILIATIONS
   ========================================================================= */

/**
 * GET /branch-admin/cash-reconciliations/daily-report?business_date=YYYY-MM-DD
 */
export async function getBranchDailyCashReport(businessDate) {
  try {
    const qs = businessDate ? `?business_date=${encodeURIComponent(businessDate)}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/cash-reconciliations/daily-report${qs}`, {
      method: 'GET',
      headers: getHeaders('branch_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch branch daily cash report', 'branch_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.getBranchDailyCashReport error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/cash-reconciliations/range-report?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&skip=0&limit=31
 */
export async function getBranchRangeCashReport({ from_date, to_date, skip = 0, limit = 31 }) {
  try {
    const params = new URLSearchParams();
    if (from_date) params.append('from_date', String(from_date).trim());
    if (to_date) params.append('to_date', String(to_date).trim());
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const res = await fetch(`${BASE_URL}/branch-admin/cash-reconciliations/range-report?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders('branch_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch branch range cash report', 'branch_admin');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('cashReconciliationService.getBranchRangeCashReport error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/cash-reconciliations/{report_id}
 * Full report with transaction details & decision history
 */
export async function getBranchAdminCashReconciliation(reportId) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    const res = await fetch(`${BASE_URL}/branch-admin/cash-reconciliations/${encodeURIComponent(reportId)}`, {
      method: 'GET',
      headers: getHeaders('branch_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch branch reconciliation report details', 'branch_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.getBranchAdminCashReconciliation error:', error);
    throw error;
  }
}

/**
 * PATCH /branch-admin/cash-reconciliations/{report_id}/decision
 * Body: { decision: 'resolved' | 'escalated', explanation: string }
 */
export async function decideBranchAdminCashReconciliation(reportId, { decision, explanation }) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    const payload = {
      decision, // 'resolved' | 'escalated'
      explanation: String(explanation || '').trim()
    };

    const res = await fetch(`${BASE_URL}/branch-admin/cash-reconciliations/${encodeURIComponent(reportId)}/decision`, {
      method: 'PATCH',
      headers: getHeaders('branch_admin'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to submit branch admin reconciliation decision', 'branch_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.decideBranchAdminCashReconciliation error:', error);
    throw error;
  }
}

/* =========================================================================
   4. SUPER ADMIN CASH RECONCILIATIONS
   ========================================================================= */

/**
 * GET /superadmin/cash-reconciliations/daily-report?business_date=YYYY-MM-DD&branch_id=...&skip=0&limit=100
 */
export async function getSuperAdminDailyCashReports({ business_date, branch_id, skip = 0, limit = 100 } = {}) {
  try {
    const params = new URLSearchParams();
    if (business_date) params.append('business_date', String(business_date).trim());
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const res = await fetch(`${BASE_URL}/superadmin/cash-reconciliations/daily-report?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch superadmin daily cash reports', 'super_admin');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('cashReconciliationService.getSuperAdminDailyCashReports error:', error);
    throw error;
  }
}

/**
 * GET /superadmin/cash-reconciliations/range-report?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&branch_id=...&skip=0&limit=100
 */
export async function getSuperAdminRangeCashReports({ from_date, to_date, branch_id, skip = 0, limit = 100 } = {}) {
  try {
    const params = new URLSearchParams();
    if (from_date) params.append('from_date', String(from_date).trim());
    if (to_date) params.append('to_date', String(to_date).trim());
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const res = await fetch(`${BASE_URL}/superadmin/cash-reconciliations/range-report?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch superadmin range cash reports', 'super_admin');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('cashReconciliationService.getSuperAdminRangeCashReports error:', error);
    throw error;
  }
}

/**
 * GET /superadmin/cash-reconciliations/{report_id}
 * Full report with transaction history & decision records
 */
export async function getSuperAdminCashReconciliation(reportId) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    const res = await fetch(`${BASE_URL}/superadmin/cash-reconciliations/${encodeURIComponent(reportId)}`, {
      method: 'GET',
      headers: getHeaders('super_admin'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch superadmin reconciliation report details', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.getSuperAdminCashReconciliation error:', error);
    throw error;
  }
}

/**
 * PATCH /superadmin/cash-reconciliations/{report_id}/decision
 * Body: { decision: 'resolved' | 'returned_to_branch', explanation: string }
 */
export async function decideSuperAdminCashReconciliation(reportId, { decision, explanation }) {
  try {
    if (!reportId) throw new Error('Report ID is required.');
    const payload = {
      decision, // 'resolved' | 'returned_to_branch'
      explanation: String(explanation || '').trim()
    };

    const res = await fetch(`${BASE_URL}/superadmin/cash-reconciliations/${encodeURIComponent(reportId)}/decision`, {
      method: 'PATCH',
      headers: getHeaders('super_admin'),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to submit superadmin reconciliation decision', 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error('cashReconciliationService.decideSuperAdminCashReconciliation error:', error);
    throw error;
  }
}
