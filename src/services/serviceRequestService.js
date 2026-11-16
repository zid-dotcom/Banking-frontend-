import { handleAuthExpired, isTokenExpiredError } from './branchService';

// Service Request API service connecting to backend member service-requests endpoints
const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Standard request headers helper for Member
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

/**
 * Parses user-friendly error messages from backend responses
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

function checkRequestStatus(res, errBody, defaultMsg, role = 'member') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role);
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/**
 * 1. POST /member/service-requests - Create Service Request
 * Body: { subject: string, message: string }
 */
export async function createMemberServiceRequest({ subject, message }) {
  try {
    const payload = {
      subject: (subject || '').trim(),
      message: (message || '').trim(),
    };

    const res = await fetch(`${BASE_URL}/member/service-requests`, {
      method: 'POST',
      headers: getMemberHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to create service request', 'member');
    }

    return await res.json();
  } catch (error) {
    console.error('serviceRequestService.createMemberServiceRequest error:', error);
    throw error;
  }
}

/**
 * 2. GET /member/service-requests - List My Service Requests
 */
export async function getMemberServiceRequests({ skip = 0, limit = 100 } = {}) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    params.append('limit', String(safeLimit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/service-requests${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch service requests', 'member');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.requests)) return data.requests;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('serviceRequestService.getMemberServiceRequests error:', error);
    throw error;
  }
}

/**
 * 3. GET /member/service-requests/{request_id} - Get My Service Request
 */
export async function getMemberServiceRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/member/service-requests/${requestId}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to fetch service request #${requestId}`, 'member');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.getMemberServiceRequest(${requestId}) error:`, error);
    throw error;
  }
}

function getBranchAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('branch_token') ||
    localStorage.getItem('branch_admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * 4. GET /branch-admin/service-requests - List Branch Service Requests
 */
export async function getBranchAdminServiceRequests({ skip = 0, limit = 100, status } = {}) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    params.append('limit', String(safeLimit));
    if (status && status !== 'all') params.append('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/service-requests${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch branch service requests', 'branch_manager');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.requests)) return data.requests;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('serviceRequestService.getBranchAdminServiceRequests error:', error);
    throw error;
  }
}

/**
 * 5. GET /branch-admin/service-requests/{request_id} - Get Branch Service Request
 */
export async function getBranchAdminServiceRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/service-requests/${requestId}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to fetch service request #${requestId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.getBranchAdminServiceRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * 6. POST /branch-admin/service-requests/{request_id}/replies - Reply To Service Request
 */
export async function replyToBranchServiceRequest(requestId, { message, reply } = {}) {
  try {
    const text = (message || reply || '').trim();
    const payload = {
      message: text,
    };

    const res = await fetch(`${BASE_URL}/branch-admin/service-requests/${requestId}/replies`, {
      method: 'POST',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to reply to service request #${requestId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.replyToBranchServiceRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * 7. PATCH /branch-admin/service-requests/{request_id}/replies/{reply_id} - Edit Branch Service Request Reply
 */
export async function editBranchServiceRequestReply(requestId, replyId, { message, reply } = {}) {
  try {
    const text = (message || reply || '').trim();
    const payload = {
      message: text,
    };

    const res = await fetch(`${BASE_URL}/branch-admin/service-requests/${requestId}/replies/${replyId}`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to edit reply #${replyId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.editBranchServiceRequestReply(${requestId}, ${replyId}) error:`, error);
    throw error;
  }
}

/**
 * 8. PATCH /branch-admin/service-requests/{request_id}/status - Update Branch Service Request Status
 * Allowed backend statuses: 'pending' | 'in_progress' | 'solved'
 */
export async function updateBranchServiceRequestStatus(requestId, status) {
  try {
    let normalizedStatus = String(status || '').trim().toLowerCase();
    if (normalizedStatus === 'open') normalizedStatus = 'pending';
    if (normalizedStatus === 'resolved' || normalizedStatus === 'closed' || normalizedStatus === 'completed') {
      normalizedStatus = 'solved';
    }

    const payload = {
      status: normalizedStatus,
    };

    const res = await fetch(`${BASE_URL}/branch-admin/service-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to update status for service request #${requestId}`, 'branch_manager');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.updateBranchServiceRequestStatus(${requestId}) error:`, error);
    throw error;
  }
}

function getSuperAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
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
 * 9. GET /superadmin/service-requests - List All Service Requests
 */
export async function getSuperAdminServiceRequests({ skip = 0, limit = 100, branch_id, status, search = '' } = {}) {
  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    params.append('limit', String(safeLimit));
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (status && status !== 'all') {
      let st = String(status).toLowerCase().trim();
      if (st === 'open') st = 'pending';
      if (st === 'resolved' || st === 'closed' || st === 'completed') st = 'solved';
      if (['pending', 'in_progress', 'solved'].includes(st)) {
        params.append('status', st);
      }
    }
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/service-requests${qs}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, 'Failed to fetch superadmin service requests', 'super_admin');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.requests)) return data.requests;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('serviceRequestService.getSuperAdminServiceRequests error:', error);
    throw error;
  }
}

/**
 * 10. GET /superadmin/service-requests/{request_id} - Get Service Request Detail
 */
export async function getSuperAdminServiceRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/service-requests/${requestId}`, {
      method: 'GET',
      headers: getSuperAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to fetch service request #${requestId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.getSuperAdminServiceRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * 11. POST /superadmin/service-requests/{request_id}/replies - Reply To Service Request
 */
export async function replyToSuperAdminServiceRequest(requestId, { message, reply } = {}) {
  try {
    const text = (message || reply || '').trim();
    const payload = {
      message: text,
    };

    const res = await fetch(`${BASE_URL}/superadmin/service-requests/${requestId}/replies`, {
      method: 'POST',
      headers: getSuperAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to post reply to service request #${requestId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.replyToSuperAdminServiceRequest(${requestId}) error:`, error);
    throw error;
  }
}

/**
 * 12. PATCH /superadmin/service-requests/{request_id}/replies/{reply_id} - Edit Service Request Reply
 */
export async function editSuperAdminServiceRequestReply(requestId, replyId, { message, reply } = {}) {
  try {
    const text = (message || reply || '').trim();
    const payload = {
      message: text,
    };

    const res = await fetch(`${BASE_URL}/superadmin/service-requests/${requestId}/replies/${replyId}`, {
      method: 'PATCH',
      headers: getSuperAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to edit reply #${replyId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.editSuperAdminServiceRequestReply(${requestId}, ${replyId}) error:`, error);
    throw error;
  }
}

/**
 * 13. PATCH /superadmin/service-requests/{request_id}/status - Update Service Request Status
 */
export async function updateSuperAdminServiceRequestStatus(requestId, status) {
  try {
    let normalizedStatus = String(status || '').trim().toLowerCase();
    if (normalizedStatus === 'open') normalizedStatus = 'pending';
    if (normalizedStatus === 'resolved' || normalizedStatus === 'closed' || normalizedStatus === 'completed') {
      normalizedStatus = 'solved';
    }

    const payload = {
      status: normalizedStatus,
    };

    const res = await fetch(`${BASE_URL}/superadmin/service-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: getSuperAdminHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkRequestStatus(res, errBody, `Failed to update status for service request #${requestId}`, 'super_admin');
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.updateSuperAdminServiceRequestStatus(${requestId}) error:`, error);
    throw error;
  }
}

export default {
  createMemberServiceRequest,
  getMemberServiceRequests,
  getMemberServiceRequest,
  getBranchAdminServiceRequests,
  getBranchAdminServiceRequest,
  replyToBranchServiceRequest,
  editBranchServiceRequestReply,
  updateBranchServiceRequestStatus,
  getSuperAdminServiceRequests,
  getSuperAdminServiceRequest,
  replyToSuperAdminServiceRequest,
  editSuperAdminServiceRequestReply,
  updateSuperAdminServiceRequestStatus,
};
