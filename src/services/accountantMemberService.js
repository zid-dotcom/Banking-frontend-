import { parseApiError, isTokenExpiredError, handleAuthExpired } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

function getHeaders(role = 'staff') {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  let token =
    localStorage.getItem('staff_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token');

  if (!token) {
    token = localStorage.getItem('auth_token');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function checkResponse(res, errBody, defaultMsg, role = 'staff') {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(role, parsedMsg);
  }
  throw new Error(parsedMsg);
}

/**
 * GET /staff/accountant/members?skip=0&limit=20
 * List accountant branch members
 */
export async function listAccountantMembers(options = {}) {
  try {
    const params = new URLSearchParams();
    const skip = options.skip !== undefined ? options.skip : 0;
    const limit = options.limit !== undefined ? options.limit : 100;
    params.set('skip', skip);
    params.set('limit', limit);

    if (options.status && options.status !== 'all') {
      params.set('status', options.status);
    }
    if (options.search) {
      params.set('search', options.search);
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/accountant/members${qs}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch accountant branch members', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error('accountantMemberService.listAccountantMembers error:', error);
    throw error;
  }
}

/**
 * GET /staff/accountant/members/{member_id}
 * Retrieve detailed profile for an individual branch member
 */
export async function getAccountantMember(memberId) {
  try {
    const res = await fetch(`${BASE_URL}/staff/accountant/members/${encodeURIComponent(memberId)}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch accountant member details', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error(`accountantMemberService.getAccountantMember(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * GET /staff/accountant/members/{member_id}/cash-transactions
 * Retrieve counter cash transactions history for a member
 */
export async function getAccountantMemberCashTransactions(memberId, options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.skip !== undefined) params.set('skip', options.skip);
    if (options.limit !== undefined) params.set('limit', options.limit);
    if (options.from_date) params.set('from_date', options.from_date);
    if (options.to_date) params.set('to_date', options.to_date);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/staff/accountant/members/${encodeURIComponent(memberId)}/cash-transactions${qs}`, {
      method: 'GET',
      headers: getHeaders('staff'),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponse(res, errBody, 'Failed to fetch member cash transactions for accountant', 'staff');
    }

    return await res.json();
  } catch (error) {
    console.error(`accountantMemberService.getAccountantMemberCashTransactions(${memberId}) error:`, error);
    throw error;
  }
}

/**
 * Retrieve a certified member document for accountant
 * Tries candidate endpoints and direct paths with staff auth headers,
 * converting the response into a blob URL for previewing.
 */
export async function getAccountantMemberDocument(memberId, docType, isNominee = false, nomineeId = null, directPath = null) {
  const staffHeaders = getHeaders('staff');
  delete staffHeaders['Content-Type'];

  // If directPath is already an external full URL
  if (typeof directPath === 'string' && (directPath.startsWith('http://') || directPath.startsWith('https://') || directPath.startsWith('data:'))) {
    return directPath;
  }

  const candidates = [];

  if (directPath && typeof directPath === 'string') {
    const cleanPath = directPath.startsWith('/') ? directPath : `/${directPath}`;
    // Candidate A: The exact direct relative path from member profile
    candidates.push(`${BASE_URL}${cleanPath}`);
    // Candidate B: Swapping /branch-admin/ with /staff/accountant/
    if (cleanPath.includes('/branch-admin/')) {
      candidates.push(`${BASE_URL}${cleanPath.replace('/branch-admin/', '/staff/accountant/')}`);
    }
  }

  if (isNominee) {
    if (nomineeId) {
      candidates.push(`${BASE_URL}/staff/accountant/nominees/${encodeURIComponent(nomineeId)}/documents/${encodeURIComponent(docType)}`);
      candidates.push(`${BASE_URL}/branch-admin/nominees/${encodeURIComponent(nomineeId)}/documents/${encodeURIComponent(docType)}`);
    }
    candidates.push(`${BASE_URL}/staff/accountant/members/${encodeURIComponent(memberId)}/nominee/documents/${encodeURIComponent(docType)}`);
    candidates.push(`${BASE_URL}/branch-admin/members/${encodeURIComponent(memberId)}/nominee/documents/${encodeURIComponent(docType)}`);
  } else {
    candidates.push(`${BASE_URL}/staff/accountant/members/${encodeURIComponent(memberId)}/documents/${encodeURIComponent(docType)}`);
    candidates.push(`${BASE_URL}/branch-admin/members/${encodeURIComponent(memberId)}/documents/${encodeURIComponent(docType)}`);
  }

  const uniqueCandidates = [...new Set(candidates)];
  let lastError = null;

  for (const url of uniqueCandidates) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: staffHeaders,
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          const target = json.url || json.document_url || json.data;
          if (typeof target === 'string') {
            if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('data:')) {
              return target;
            }
            if (target.startsWith('/')) {
              const subRes = await fetch(`${BASE_URL}${target}`, {
                method: 'GET',
                headers: staffHeaders,
              });
              if (subRes.ok) {
                const subBlob = await subRes.blob();
                return URL.createObjectURL(subBlob);
              }
            }
          }
          return target || json;
        }

        const blob = await res.blob();
        return URL.createObjectURL(blob);
      } else {
        lastError = new Error(`Document fetch failed with status ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  throw new Error(`Could not load document: ${docType}`);
}

