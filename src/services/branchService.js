// Branch API service connecting to backend superadmin branches endpoints
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
 * Detect role from current window location if not explicitly provided
 */
export function getRoleFromLocation() {
  const p = window.location.pathname;
  if (p.startsWith('/member/') || p === '/member-login' || p === '/member/login') {
    return 'member';
  }
  if (p.startsWith('/branch-manager/') || p.startsWith('/branch-admin/') || p === '/branch-manager-login') {
    return 'branch_manager';
  }
  return 'super_admin';
}

/**
 * Checks if response or error message indicates an expired/invalid token
 */
export function isTokenExpiredError(res, parsedMsg = '') {
  const msgLower = (parsedMsg || '').toLowerCase();
  return (
    res?.status === 401 ||
    res?.status === 403 ||
    msgLower.includes('expired token') ||
    msgLower.includes('token is expired') ||
    msgLower.includes('token has expired') ||
    msgLower.includes('invalid or expired') ||
    msgLower.includes('not authenticated') ||
    msgLower.includes('invalid token') ||
    msgLower.includes('could not validate credentials')
  );
}

/**
 * Handle expired token: cleans tokens, sets notification, and navigates to login
 */
export function handleAuthExpired(role = null) {
  const effectiveRole = role || getRoleFromLocation();

  if (effectiveRole === 'member') {
    localStorage.removeItem('member_token');
    localStorage.removeItem('member_user');
  } else if (effectiveRole === 'branch_manager' || effectiveRole === 'branch_admin') {
    localStorage.removeItem('branch_token');
    localStorage.removeItem('branch_user');
    localStorage.removeItem('branch_manager_user');
  } else {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
  }
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('auth_token');

  sessionStorage.setItem('auth_expired_message', 'Token is expired. Please login again.');

  const targetPath = effectiveRole === 'member'
    ? '/member-login?expired=true'
    : (effectiveRole === 'branch_manager' || effectiveRole === 'branch_admin')
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
 * (specifically handles FastAPI/Pydantic 422 detail arrays, strings, etc.)
 */
export function parseApiError(errBody, status, fallbackMessage = 'Operation failed') {
  if (!errBody) return `${fallbackMessage} (${status || 'Unknown'})`;
  if (typeof errBody === 'string') return errBody;

  // FastAPI detail format: can be string or array of error objects
  if (typeof errBody.detail === 'string') {
    return errBody.detail;
  }

  if (Array.isArray(errBody.detail)) {
    const messages = errBody.detail.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const msg = item.msg || item.message || JSON.stringify(item);
        // Clean up FastAPI "Value error, " prefix if present
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
 * 1. GET /superadmin/branches - List all branches
 */
export async function getBranches() {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branches');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.branches)) return data.branches;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  } catch (error) {
    console.error('branchService.getBranches error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/branches/{branch_id} - Get specific branch details
 */
export async function getBranch(branchId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch branch #${branchId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchService.getBranch(${branchId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/branches - Create new branch
 */
export async function createBranch(branchData) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(branchData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create branch');
    }

    return await res.json();
  } catch (error) {
    console.error('branchService.createBranch error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/branches/{branch_id} - Update existing branch
 */
export async function updateBranch(branchId, branchData) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(branchData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to update branch');
    }

    return await res.json();
  } catch (error) {
    console.error(`branchService.updateBranch(${branchId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /superadmin/branches/{branch_id} - Delete branch
 */
export async function deleteBranch(branchId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to delete branch');
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`branchService.deleteBranch(${branchId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /superadmin/branches/{branch_id}/status - Change branch active status
 * Request body: { is_active: boolean }
 */
export async function changeBranchStatus(branchId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to change branch status');
    }

    return await res.json();
  } catch (error) {
    console.error(`branchService.changeBranchStatus(${branchId}) error:`, error);
    throw error;
  }
}
