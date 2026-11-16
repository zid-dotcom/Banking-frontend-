// Branch Admin API service connecting to backend superadmin branch-admins endpoints
import { parseApiError, handleAuthExpired } from './branchService';

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

  const token = localStorage.getItem('branch_token') ||
                localStorage.getItem('token') || 
                localStorage.getItem('access_token') || 
                localStorage.getItem('superadmin_token') || 
                localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Check response and handle expired token
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
 * 1. GET /superadmin/branch-admins - List all branch admins
 */
export async function getBranchAdmins() {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch admins');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.admins)) return data.admins;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('branchAdminService.getBranchAdmins error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/branch-admins/{admin_id} - Get specific branch admin
 */
export async function getBranchAdmin(adminId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins/${adminId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch branch admin #${adminId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.getBranchAdmin(${adminId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/branch-admins - Create new branch admin
 * Schema: { full_name, email, password, contact_number, branch_id }
 */
export async function createBranchAdmin(adminData) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(adminData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create branch admin');
    }

    return await res.json();
  } catch (error) {
    console.error('branchAdminService.createBranchAdmin error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/branch-admins/{admin_id} - Update existing branch admin
 */
export async function updateBranchAdmin(adminId, adminData) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins/${adminId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(adminData),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to update branch admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.updateBranchAdmin(${adminId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /superadmin/branch-admins/{admin_id} - Delete branch admin
 */
export async function deleteBranchAdmin(adminId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins/${adminId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to delete branch admin');
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`branchAdminService.deleteBranchAdmin(${adminId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /superadmin/branch-admins/{admin_id}/unlock - Unlock branch admin account
 */
export async function unlockBranchAdmin(adminId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins/${adminId}/unlock`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to unlock branch admin');
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`branchAdminService.unlockBranchAdmin(${adminId}) error:`, error);
    throw error;
  }
}

/**
 * 7. PATCH /superadmin/branch-admins/{admin_id}/status - Change active status
 * Request body: { is_active: boolean }
 */
export async function changeBranchAdminStatus(adminId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branch-admins/${adminId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to change branch admin status');
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.changeBranchAdminStatus(${adminId}) error:`, error);
    throw error;
  }
}

/**
 * 8. POST /branch-admin/login - Branch Admin / Manager Authentication
 * Body: application/x-www-form-urlencoded { username, password, grant_type }
 */
export async function branchAdminLogin(username, password) {
  try {
    const formBody = new URLSearchParams();
    formBody.append('username', username.trim());
    formBody.append('password', password);
    formBody.append('grant_type', 'password');

    const res = await fetch(`${BASE_URL}/branch-admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      body: formBody.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const parsed = parseApiError(data, res.status, 'Branch Admin authentication failed');
      throw new Error(parsed);
    }

    // Persist session tokens & credentials
    const token = data.access_token || data.token;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
      localStorage.setItem('branch_token', token);
    }
    if (data.user || data.branch_admin || data.admin) {
      localStorage.setItem('branch_user', JSON.stringify(data.user || data.branch_admin || data.admin));
      localStorage.setItem('branch_manager_user', JSON.stringify(data.user || data.branch_admin || data.admin));
    }

    // Attempt to eagerly load profile from /branch-admin/me
    try {
      if (token) {
        const profile = await getBranchAdminMe(token);
        if (profile) {
          localStorage.setItem('branch_user', JSON.stringify(profile));
          localStorage.setItem('branch_manager_user', JSON.stringify(profile));
        }
      }
    } catch (e) {
      console.warn('Could not auto-fetch branch admin profile immediately after login:', e);
    }

    return data;
  } catch (error) {
    console.error('branchAdminService.branchAdminLogin error:', error);
    throw error;
  }
}

/**
 * 9. GET /branch-admin/me - Current Authenticated Branch Admin Details
 * Returns: { id, user_code, full_name, email, contact_number, role, branch_id, is_active, created_at }
 */
export async function getBranchAdminMe(explicitToken = null) {
  try {
    const token = explicitToken ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('branch_token');

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/branch-admin/me`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to fetch branch admin profile');
      throw new Error(msg);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('branchAdminService.getBranchAdminMe error:', error);
    throw error;
  }
}

/**
 * Helper to check branch admin response and handle expired token
 */
function checkBranchAdminResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  const isExpired = 
    res.status === 401 || 
    res.status === 403 || 
    parsedMsg.toLowerCase().includes('expired token') || 
    parsedMsg.toLowerCase().includes('invalid or expired') ||
    parsedMsg.toLowerCase().includes('token has expired');

  if (isExpired) {
    handleAuthExpired('branch_manager');
    throw new Error('Session has expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 10. GET /branch-admin/members - List Members belonging to current branch admin's branch
 * Supports query params: skip, limit, member_status, is_active, search
 */
export async function getBranchAdminMembers({ skip = 0, limit = 100, member_status, is_active, search } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (member_status && member_status !== 'all') params.append('member_status', member_status);
    if (is_active !== undefined && is_active !== null && is_active !== 'all') params.append('is_active', String(is_active));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/members${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, 'Failed to fetch branch members');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data?.members || []);
  } catch (error) {
    console.error('branchAdminService.getBranchAdminMembers error:', error);
    throw error;
  }
}

/**
 * 11. GET /branch-admin/members/{member_id} - Get Member Details
 */
export async function getBranchAdminMember(memberId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/members/${memberId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to fetch member details #${memberId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.getBranchAdminMember(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * 12. GET /branch-admin/members/{member_id}/documents/{doc_name} - Get Member Document
 */
export async function getBranchAdminMemberDocument(memberId, docName) {
  try {
    const headers = getHeaders();
    delete headers['Content-Type'];

    const res = await fetch(`${BASE_URL}/branch-admin/members/${memberId}/documents/${encodeURIComponent(docName)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to load document: ${docName}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.document_url || json;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`branchAdminService.getBranchAdminMemberDocument(${memberId}, ${docName}) error:`, error);
    throw error;
  }
}

/**
 * 13. PATCH /branch-admin/members/{member_id}/status - Review Member (approve / reject)
 * Request body: { status: 'approved' | 'rejected', rejection_reason?: string }
 */
export async function reviewBranchAdminMember(memberId, { status, rejection_reason = null } = {}) {
  try {
    const body = { status: status.toLowerCase() };
    if (rejection_reason) {
      body.rejection_reason = rejection_reason;
    }

    const res = await fetch(`${BASE_URL}/branch-admin/members/${memberId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to review member #${memberId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.reviewBranchAdminMember(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * 14. PATCH /branch-admin/members/{member_id}/active - Change Member Active
 * Request body: { is_active: boolean }
 */
export async function changeBranchAdminMemberActive(memberId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/members/${memberId}/active`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to change member active status #${memberId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.changeBranchAdminMemberActive(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * 15. PATCH /branch-admin/members/{member_id}/reset-password - Reset Member Password
 * Request body: { new_password: string } (8-72 chars)
 */
export async function resetBranchAdminMemberPassword(memberId, newPassword) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/members/${memberId}/reset-password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to reset member password #${memberId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`branchAdminService.resetBranchAdminMemberPassword(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * 16. PATCH /branch-admin/members/{member_id}/unlock - Unlock Member
 */
export async function unlockBranchAdminMember(memberId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/members/${memberId}/unlock`, {
      method: 'PATCH',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to unlock member #${memberId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`branchAdminService.unlockBranchAdminMember(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * 17. Nominees Endpoints for Branch Admin
 * GET /branch-admin/nominees - List Nominees
 */
export async function getBranchAdminNominees({ skip = 0, limit = 50, nominee_status, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (nominee_status && nominee_status !== 'all') params.append('nominee_status', nominee_status);
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/nominees${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, 'Failed to fetch nominees');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.nominees)) return data.nominees;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('branchAdminService.getBranchAdminNominees error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/nominees/{nominee_id} - Get Nominee
 */
export async function getBranchAdminNominee(nomineeId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/nominees/${nomineeId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to fetch nominee #${nomineeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.getBranchAdminNominee(${nomineeId}) error:`, error);
    throw error;
  }
}

/**
 * GET /branch-admin/nominees/{nominee_id}/documents/{doc_name} - Get Nominee Document
 */
export async function getBranchAdminNomineeDocument(nomineeId, docName) {
  try {
    const headers = getHeaders();
    delete headers['Content-Type'];

    const res = await fetch(`${BASE_URL}/branch-admin/nominees/${nomineeId}/documents/${encodeURIComponent(docName)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to load nominee document: ${docName}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.document_url || json;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`branchAdminService.getBranchAdminNomineeDocument(${nomineeId}, ${docName}) error:`, error);
    throw error;
  }
}

/**
 * PATCH /branch-admin/nominees/{nominee_id}/status - Review Nominee (approve / reject)
 */
export async function reviewBranchAdminNominee(nomineeId, { status, rejection_reason = null } = {}) {
  try {
    const body = { status: status.toLowerCase() };
    if (rejection_reason && rejection_reason.trim()) {
      body.rejection_reason = rejection_reason.trim();
    }

    const res = await fetch(`${BASE_URL}/branch-admin/nominees/${nomineeId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, `Failed to review nominee #${nomineeId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchAdminService.reviewBranchAdminNominee(${nomineeId}) error:`, error);
    throw error;
  }
}

/**
 * 18. GET /branch-admin/loan-schemes - List Available Loan Schemes for Branch Admin
 * Query parameters: skip, limit, search
 */
export async function getBranchAdminLoanSchemes({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/loan-schemes${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, 'Failed to fetch available loan schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('branchAdminService.getBranchAdminLoanSchemes error:', error);
    throw error;
  }
}

/**
 * 19. GET /branch-admin/staff-roles - List Available Staff Roles for Branch Admin
 */
export async function getBranchAdminStaffRoles({ skip = 0, limit = 100, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/staff-roles${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, 'Failed to fetch available staff roles');
    }

    const data = await res.json();
    let rawList = [];
    if (Array.isArray(data)) rawList = data;
    else if (Array.isArray(data.items)) rawList = data.items;
    else if (Array.isArray(data.roles)) rawList = data.roles;
    else if (Array.isArray(data.data)) rawList = data.data;

    return rawList.map((r) => ({
      id: Number(r.id !== undefined ? r.id : r.role_id),
      name: r.name || r.role_name || r.title || `Role #${r.id}`,
      description: r.description || '',
      is_active: r.is_active !== false,
      created_at: r.created_at,
      ...r,
    }));
  } catch (error) {
    console.error('branchAdminService.getBranchAdminStaffRoles error:', error);
    throw error;
  }
}

/**
 * 20. GET /branch-admin/savings-schemes - List Available Savings Schemes for Branch Admin
 */
export async function getBranchAdminSavingsSchemes({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/savings-schemes${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, 'Failed to fetch available savings schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('branchAdminService.getBranchAdminSavingsSchemes error:', error);
    throw error;
  }
}

/**
 * 21. GET /branch-admin/fd-mis-schemes - List Available FD/MIS Schemes for Branch Admin
 */
export async function getBranchAdminFdMisSchemes({ skip = 0, limit = 50, search = '' } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/fd-mis-schemes${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminResponseStatus(res, errBody, 'Failed to fetch available FD/MIS schemes');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.schemes)) return data.schemes;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('branchAdminService.getBranchAdminFdMisSchemes error:', error);
    throw error;
  }
}

/**
 * 23. GET /branch-admin/announcements - List Announcements For Branch Admin
 */
export { getBranchAdminAnnouncements } from './announcementService';

/**
 * 24. Branch Admin Service Requests endpoints
 * GET   /branch-admin/service-requests
 * GET   /branch-admin/service-requests/{request_id}
 * POST  /branch-admin/service-requests/{request_id}/replies
 * PATCH /branch-admin/service-requests/{request_id}/replies/{reply_id}
 * PATCH /branch-admin/service-requests/{request_id}/status
 */
export {
  getBranchAdminServiceRequests,
  getBranchAdminServiceRequest,
  replyToBranchServiceRequest,
  editBranchServiceRequestReply,
  updateBranchServiceRequestStatus,
} from './serviceRequestService';



