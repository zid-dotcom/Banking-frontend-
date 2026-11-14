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
      throw new Error(parseApiError(errBody, res.status, 'Failed to create service request'));
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
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/member/service-requests${qs}`, {
      method: 'GET',
      headers: getMemberHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch service requests'));
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
      throw new Error(parseApiError(errBody, res.status, `Failed to fetch service request #${requestId}`));
    }

    return await res.json();
  } catch (error) {
    console.error(`serviceRequestService.getMemberServiceRequest(${requestId}) error:`, error);
    throw error;
  }
}

export default {
  createMemberServiceRequest,
  getMemberServiceRequests,
  getMemberServiceRequest,
};
