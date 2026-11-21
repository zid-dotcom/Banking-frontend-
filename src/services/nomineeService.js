// Nominee API service connecting to backend branch-admin & member nominees endpoints
import { handleAuthExpired, isTokenExpiredError } from './branchService';
import {
  getBranchAdminNominees,
  getBranchAdminNominee,
  getBranchAdminNomineeDocument,
  reviewBranchAdminNominee
} from './branchAdminService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

function getMemberHeaders(isMultipart = false) {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

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

function parseApiError(errBody, status, fallbackMessage = 'Operation failed') {
  if (!errBody) return `${fallbackMessage} (${status || 'Unknown'})`;
  if (typeof errBody === 'string') return errBody;
  if (typeof errBody.detail === 'string') return errBody.detail;
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
  if (typeof errBody.message === 'string') return errBody.message;
  if (typeof errBody.error === 'string') return errBody.error;
  return `${fallbackMessage} (${status || 'Error'})`;
}

function checkMemberResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired('member');
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

function getBranchAdminHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };
  const token =
    localStorage.getItem('branch_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function checkBranchResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired('branch_manager');
    throw new Error('Token is expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/**
 * 1. GET /member/nominee - Get My Nominee
 */
export async function getMemberNominee() {
  try {
    const res = await fetch(`${BASE_URL}/member/nominee`, {
      method: 'GET',
      headers: getMemberHeaders(false),
    });

    if (res.status === 404) {
      // No nominee submitted yet
      return null;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkMemberResponseStatus(res, errBody, 'Failed to fetch nominee details');
    }

    return await res.json();
  } catch (error) {
    console.error('nomineeService.getMemberNominee error:', error);
    throw error;
  }
}

/**
 * 1b. GET /member/nominee/documents/{doc_name} - Get Nominee Document
 */
export async function getMemberNomineeDocument(docName) {
  try {
    const headers = getMemberHeaders(false);
    delete headers['Content-Type'];

    let endpoint = `${BASE_URL}/member/nominee/documents/${encodeURIComponent(docName)}`;
    if (typeof docName === 'string') {
      if (docName.startsWith('http://') || docName.startsWith('https://')) {
        endpoint = docName;
      } else if (docName.startsWith('/')) {
        endpoint = `${BASE_URL}${docName}`;
      }
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkMemberResponseStatus(res, errBody, `Failed to load nominee document: ${docName}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      const target = json.url || json.document_url || json.data;
      if (typeof target === 'string') {
        if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('data:')) {
          return {
            url: target,
            isPdf: target.toLowerCase().includes('.pdf') || target.startsWith('data:application/pdf')
          };
        }
        if (target.startsWith('/')) {
          const subRes = await fetch(`${BASE_URL}${target}`, {
            method: 'GET',
            headers,
          });
          if (subRes.ok) {
            const subType = subRes.headers.get('content-type') || '';
            const subBlob = await subRes.blob();
            return {
              url: URL.createObjectURL(subBlob),
              isPdf: subType.includes('pdf') || target.toLowerCase().endsWith('.pdf')
            };
          }
        }
      }
      return { url: target || json, isPdf: false };
    }

    const isPdf = contentType.includes('pdf');
    const blob = await res.blob();
    return {
      url: URL.createObjectURL(blob),
      isPdf
    };
  } catch (error) {
    console.error(`nomineeService.getMemberNomineeDocument(${docName}) error:`, error);
    throw error;
  }
}

/**
 * 2. POST /member/nominee - Submit Nominee (multipart/form-data)
 * Fields:
 * - nominee_name (string)
 * - relationship_type (string)
 * - date_of_birth (string YYYY-MM-DD)
 * - aadhaar_front (file)
 * - aadhaar_back (file)
 */
export async function submitMemberNominee(payload) {
  try {
    let body;
    if (payload instanceof FormData) {
      body = payload;
    } else {
      body = new FormData();
      if (payload.nominee_name) body.append('nominee_name', payload.nominee_name);
      if (payload.relationship_type) body.append('relationship_type', payload.relationship_type);
      if (payload.date_of_birth) body.append('date_of_birth', payload.date_of_birth);
      if (payload.aadhaar_front) body.append('aadhaar_front', payload.aadhaar_front);
      if (payload.aadhaar_back) body.append('aadhaar_back', payload.aadhaar_back);
    }

    const res = await fetch(`${BASE_URL}/member/nominee`, {
      method: 'POST',
      headers: getMemberHeaders(true),
      body,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkMemberResponseStatus(res, errBody, 'Failed to submit nominee');
    }

    return await res.json();
  } catch (error) {
    console.error('nomineeService.submitMemberNominee error:', error);
    throw error;
  }
}

/**
 * 3. POST /member/nominee-change-requests - Create Nominee Change Request
 */
export async function createMemberNomineeChangeRequest({ subject, message }) {
  try {
    const res = await fetch(`${BASE_URL}/member/nominee-change-requests`, {
      method: 'POST',
      headers: getMemberHeaders(false),
      body: JSON.stringify({ subject, message }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkMemberResponseStatus(res, errBody, 'Failed to submit nominee change request');
    }

    return await res.json();
  } catch (error) {
    console.error('nomineeService.createMemberNomineeChangeRequest error:', error);
    throw error;
  }
}

/**
 * 4. GET /member/nominee-change-requests - List My Nominee Change Requests
 */
export async function getMemberNomineeChangeRequests({ skip = 0, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (skip) params.append('skip', skip);
    if (limit) params.append('limit', limit);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/nominee-change-requests${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(false),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkMemberResponseStatus(res, errBody, 'Failed to fetch nominee change requests');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('nomineeService.getMemberNomineeChangeRequests error:', error);
    throw error;
  }
}

/**
 * 5. GET /member/nominee-change-requests/{request_id} - Get My Nominee Change Request
 */
export async function getMemberNomineeChangeRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/member/nominee-change-requests/${requestId}`, {
      method: 'GET',
      headers: getMemberHeaders(false),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkMemberResponseStatus(res, errBody, 'Failed to fetch nominee change request details');
    }

    return await res.json();
  } catch (error) {
    console.error('nomineeService.getMemberNomineeChangeRequest error:', error);
    throw error;
  }
}

/**
 * 6. GET /branch-admin/nominee-change-requests - List Nominee Change Requests
 */
export async function getBranchAdminNomineeChangeRequests({
  skip = 0,
  limit = 50,
  status = null,
  search = null,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip) params.append('skip', skip);
    if (limit) params.append('limit', limit);
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/nominee-change-requests${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchResponseStatus(res, errBody, 'Failed to fetch nominee change requests');
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('nomineeService.getBranchAdminNomineeChangeRequests error:', error);
    throw error;
  }
}

/**
 * 7. GET /branch-admin/nominee-change-requests/{request_id} - Get Nominee Change Request
 */
export async function getBranchAdminNomineeChangeRequest(requestId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/nominee-change-requests/${requestId}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchResponseStatus(res, errBody, 'Failed to fetch nominee change request details');
    }

    return await res.json();
  } catch (error) {
    console.error('nomineeService.getBranchAdminNomineeChangeRequest error:', error);
    throw error;
  }
}

/**
 * 8. PATCH /branch-admin/nominee-change-requests/{request_id}/status - Review Nominee Change Request
 */
export async function reviewBranchAdminNomineeChangeRequest(requestId, { status, rejection_reason = null }) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/nominee-change-requests/${requestId}/status`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify({
        status,
        rejection_reason: rejection_reason || null,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchResponseStatus(res, errBody, `Failed to ${status} nominee change request`);
    }

    return await res.json();
  } catch (error) {
    console.error('nomineeService.reviewBranchAdminNomineeChangeRequest error:', error);
    throw error;
  }
}

export {
  getBranchAdminNominees,
  getBranchAdminNominee,
  getBranchAdminNomineeDocument,
  reviewBranchAdminNominee
};
