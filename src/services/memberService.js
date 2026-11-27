// Super Admin Member API service connecting to backend superadmin branches members endpoints
import { parseApiError, handleAuthExpired, isTokenExpiredError } from './branchService';

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
 * Check response and handle expired token
 */
function checkResponseStatus(res, errBody, defaultMsg, explicitRole = null) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired(explicitRole);
    throw new Error('Token is expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/branches/{branch_id}/members - List Branch Members For Superadmin
 * Response schema: { branch: {...}, members: [...] }
 */
export async function getSuperadminBranchMembers(branchId, { skip = 0, limit = 100 } = {}) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/members?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch members for branch #${branchId}`);
    }

    const data = await res.json();
    // Return standardized { branch, members }
    if (data && Array.isArray(data.members)) {
      return data;
    }
    if (Array.isArray(data)) {
      return { branch: null, members: data };
    }
    return { branch: null, members: [] };
  } catch (error) {
    console.error(`memberService.getSuperadminBranchMembers(${branchId}) error:`, error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/branches/{branch_id}/members/{member_id} - Get Branch Member For Superadmin
 * Response schema: MemberDetailOut
 */
export async function getSuperadminBranchMember(branchId, memberId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/members/${memberId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch member details #${memberId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`memberService.getSuperadminBranchMember(${branchId}, ${memberId}) error:`, error);
    throw error;
  }
}

/**
 * 3. GET /superadmin/branches/{branch_id}/members/{member_id}/documents/{doc_name} - Get Branch Member Document
 */
export async function getSuperadminMemberDocument(branchId, memberId, docName) {
  try {
    const headers = getHeaders();
    delete headers['Content-Type'];

    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/members/${memberId}/documents/${encodeURIComponent(docName)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to load document: ${docName}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.document_url || json;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`memberService.getSuperadminMemberDocument(${branchId}, ${memberId}, ${docName}) error:`, error);
    throw error;
  }
}

/**
 * 4. GET /superadmin/branches/{branch_id}/members/{member_id}/nominee/documents/{doc_name} - Get Nominee Document
 */
export async function getSuperadminMemberNomineeDocument(branchId, memberId, docName) {
  try {
    const headers = getHeaders();
    delete headers['Content-Type'];

    const res = await fetch(`${BASE_URL}/superadmin/branches/${branchId}/members/${memberId}/nominee/documents/${encodeURIComponent(docName)}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to load nominee document: ${docName}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.document_url || json;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`memberService.getSuperadminMemberNomineeDocument(${branchId}, ${memberId}, ${docName}) error:`, error);
    throw error;
  }
}

/**
 * 5. GET /member/branches - List active branches for public member registration
 */
export async function getMemberBranches() {
  try {
    const res = await fetch(`${BASE_URL}/member/branches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Failed to fetch branch list');
      throw new Error(msg);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('memberService.getMemberBranches error:', error);
    throw error;
  }
}

/**
 * 6. POST /member/login - Member Authentication (OAuth2 Password Request Form)
 */
export async function memberLogin({ username, password }) {
  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append('username', username.trim());
    bodyParams.append('password', password);
    bodyParams.append('grant_type', 'password');

    const res = await fetch(`${BASE_URL}/member/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      body: bodyParams.toString(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errorMsg = parseApiError(errBody, res.status, 'Invalid member credentials');
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const token = data.access_token;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
      localStorage.setItem('member_token', token);

      // Attempt to load member profile info
      try {
        const profile = await getMemberMe(token);
        if (profile) {
          localStorage.setItem('member_user', JSON.stringify(profile));
          return { ...data, user: profile };
        }
      } catch (profileErr) {
        console.warn('Could not fetch /member/me right after login:', profileErr);
      }
    }

    return data;
  } catch (error) {
    console.error('memberService.memberLogin error:', error);
    throw error;
  }
}

/**
 * 7. GET /member/me - Current Authenticated Member Details
 */
export async function getMemberMe(explicitToken = null) {
  try {
    const token = explicitToken ||
                  localStorage.getItem('token') ||
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('member_token');

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/member/me`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch member profile', 'member');
    }

    return await res.json();
  } catch (error) {
    console.error('memberService.getMemberMe error:', error);
    throw error;
  }
}

/**
 * 7b. GET /member/profile/full - Member Full Profile
 * Returns MemberFullProfileOut:
 * {
 *   member_code, full_name, email, mobile, branch_id, branch,
 *   date_of_birth, gender, country, state, district, city, street,
 *   building_no, zip_code, aadhaar_masked, pan_masked, bank_holder_name,
 *   bank_account_masked, ifsc_code, status, kyc_status, kyc_rejection_reason,
 *   kyc_reviewed_at, member_created_at, nominee
 * }
 */
export async function getMemberFullProfile(explicitToken = null) {
  try {
    const token =
      explicitToken ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('member_token');

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}/member/profile/full`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch member full profile', 'member');
    }

    return await res.json();
  } catch (error) {
    console.error('memberService.getMemberFullProfile error:', error);
    throw error;
  }
}

/**
 * 7c. GET /member/profile/documents/{doc_name} - View Member Profile KYC Document
 * doc_name can be 'aadhaar_front', 'aadhaar_back', 'pan_image', 'passbook_image' or full/relative URL.
 */
export async function getMemberProfileDocument(docName) {
  try {
    const token =
      localStorage.getItem('member_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');

    const headers = {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let endpoint = `${BASE_URL}/member/profile/documents/${encodeURIComponent(docName)}`;
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
      checkResponseStatus(res, errBody, `Failed to load member document: ${docName}`, 'member');
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
    console.error(`memberService.getMemberProfileDocument(${docName}) error:`, error);
    throw error;
  }
}

/**
 * 7d. GET /member/profile/documents/{doc_name}/download - Download Member Profile KYC Document
 */
export async function downloadMemberProfileDocument(docName, filename = 'document') {
  try {
    const token =
      localStorage.getItem('member_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');

    const headers = {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let downloadEndpoint = `${BASE_URL}/member/profile/documents/${encodeURIComponent(docName)}/download`;
    if (typeof docName === 'string') {
      if (docName.includes('/download')) {
        downloadEndpoint = docName.startsWith('http') ? docName : `${BASE_URL}${docName.startsWith('/') ? '' : '/'}${docName}`;
      } else if (docName.startsWith('/')) {
        downloadEndpoint = `${BASE_URL}${docName}/download`;
      }
    }

    let res = await fetch(downloadEndpoint, {
      method: 'GET',
      headers,
    });

    if (!res.ok && res.status === 404) {
      let viewEndpoint = `${BASE_URL}/member/profile/documents/${encodeURIComponent(docName)}`;
      if (typeof docName === 'string' && docName.startsWith('/')) {
        viewEndpoint = `${BASE_URL}${docName.replace(/\/download$/, '')}`;
      }
      res = await fetch(viewEndpoint, {
        method: 'GET',
        headers,
      });
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to download document: ${docName}`, 'member');
    }

    const contentType = res.headers.get('content-type') || '';
    const blob = await res.blob();

    let finalFilename = filename;
    if (!finalFilename.includes('.')) {
      if (contentType.includes('pdf')) {
        finalFilename += '.pdf';
      } else if (contentType.includes('png')) {
        finalFilename += '.png';
      } else {
        finalFilename += '.jpg';
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return true;
  } catch (error) {
    console.error(`memberService.downloadMemberProfileDocument(${docName}) error:`, error);
    throw error;
  }
}

/**
 * 8. POST /member/register - Register New Member (multipart/form-data)
 */
export async function registerMember(formData) {
  try {
    const res = await fetch(`${BASE_URL}/member/register`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Member registration failed');
      throw new Error(msg);
    }

    return await res.json();
  } catch (error) {
    console.error('memberService.registerMember error:', error);
    throw error;
  }
}

/**
 * 9. POST /member/reapply - Reapply Member (multipart/form-data)
 */
export async function reapplyMember(formData) {
  try {
    const res = await fetch(`${BASE_URL}/member/reapply`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = parseApiError(errBody, res.status, 'Member reapplication failed');
      throw new Error(msg);
    }

    return await res.json();
  } catch (error) {
    console.error('memberService.reapplyMember error:', error);
    throw error;
  }
}    
 
  

/**
 * 10. GET /member/savings-schemes - List Available Savings Schemes
 */
export { getMemberSavingsSchemes } from './savingsSchemeService';

/**
 * 11. GET /member/fd-mis-schemes - List Available FD/MIS Schemes
 */
export { getMemberFdMisSchemes } from './fdMisSchemeService';

/**
 * 12. GET /member/loan-schemes - List Available Loan Schemes
 */
export { getMemberLoanSchemes } from './loanSchemeService';

/**
 * 13. GET /member/announcements - List Announcements For Member
 */
export { getMemberAnnouncements } from './announcementService';

/**
 * 14. Member Service Requests APIs
 * - POST /member/service-requests
 * - GET /member/service-requests
 * - GET /member/service-requests/{request_id}
 */
export {
  createMemberServiceRequest,
  getMemberServiceRequests,
  getMemberServiceRequest,
} from './serviceRequestService';

/**
 * 15. Member Notifications APIs
 * - GET /member/notifications
 * - GET /member/notifications/unread-count
 * - PATCH /member/notifications/read-all
 * - PATCH /member/notifications/{notification_id}/read
 */
export {
  getMemberNotifications,
  getMemberUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  notifyNotificationsUpdated,
  NOTIFICATIONS_UPDATED_EVENT,
} from './notificationService';

/**
 * 16. Member Nominee APIs
 * - GET /member/nominee
 * - POST /member/nominee
 */
export {
  getMemberNominee,
  submitMemberNominee,
  getMemberNomineeDocument,
  downloadMemberNomineeDocument,
} from './nomineeService';

/**
 * 17. Accountant Branch Member APIs
 * - GET /staff/accountant/members
 * - GET /staff/accountant/members/{member_id}
 */
export {
  listAccountantMembers,
  getAccountantMember,
} from './accountantMemberService';

/**
 * 18. Auth & Password APIs
 * - POST /auth/change-password
 * - POST /member/forgot-password
 * - POST /member/reset-password
 */
export { changePassword, memberForgotPassword, memberResetPassword } from './authService';

export {
  getMemberRegistrationSettings,
  getMemberRegistrationQrCode,
  resolveBranchQrImageUrl,
  lookupMemberStaffCode,
} from './membershipSettingsService';




