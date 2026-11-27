// Branch Admin Membership Settings & Member Registration Applications API Service
import { parseApiError, handleAuthExpired, isTokenExpiredError } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

function getBranchAdminHeaders(isMultipart = false) {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const token =
    localStorage.getItem('branch_token') ||
    localStorage.getItem('branch_manager_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

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

function checkBranchAdminStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  if (isTokenExpiredError(res, parsedMsg)) {
    handleAuthExpired('branch_manager');
    throw new Error('Branch session expired. Please login again.');
  }
  throw new Error(parsedMsg);
}

/* =========================================================================
   HELPER: Resolve QR Code Image Blob URL
   ========================================================================= */

/**
 * Helper to fetch and resolve branch QR code as a displayable blob URL
 * Handles relative backend URLs and ngrok headers
 */
export async function resolveBranchQrImageUrl(rawUrl, branchId = null) {
  if (!rawUrl && !branchId) return null;
  const path = rawUrl || (branchId ? `/member/registration-settings/${branchId}/qr-code` : null);
  if (!path) return null;
  const fullUrl = path.startsWith('http')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!res.ok) {
      return fullUrl;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.qr_code_url || json.qr_image_url || fullUrl;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('resolveBranchQrImageUrl error:', err);
    return fullUrl;
  }
}

/* =========================================================================
   1. BRANCH ADMIN MEMBERSHIP SETTINGS (Fee & QR Code)
   ========================================================================= */

/**
 * GET /branch-admin/membership-settings
 * View the branch's configured fee and QR image URL.
 */
export async function getBranchAdminMembershipSettings() {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/membership-settings`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      // If 404 or 409 means not configured yet
      if (res.status === 404 || res.status === 409) {
        return null;
      }
      checkBranchAdminStatus(res, errBody, 'Failed to fetch branch membership settings');
    }

    const data = await res.json();
    if (data) {
      const qrPath = data.qr_image_url || data.qr_code_url || (data.branch_id ? `/member/registration-settings/${data.branch_id}/qr-code` : null);
      if (qrPath) {
        data.qr_display_url = await resolveBranchQrImageUrl(qrPath, data.branch_id);
      }
    }
    return data;
  } catch (error) {
    console.error('membershipSettingsService.getBranchAdminMembershipSettings error:', error);
    throw error;
  }
}

/**
 * POST /branch-admin/membership-settings
 * Set the branch membership fee and upload its QR image.
 * @param {FormData|Object} payload { membership_fee: number|string, qr_image: File }
 */
export async function createBranchAdminMembershipSettings(payload) {
  try {
    let body = payload;
    if (!(payload instanceof FormData)) {
      body = new FormData();
      if (payload.membership_fee !== undefined && payload.membership_fee !== null) {
        body.append('membership_fee', String(payload.membership_fee));
      }
      if (payload.qr_image) {
        body.append('qr_image', payload.qr_image);
      }
    }

    const res = await fetch(`${BASE_URL}/branch-admin/membership-settings`, {
      method: 'POST',
      headers: getBranchAdminHeaders(true),
      body,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminStatus(res, errBody, 'Failed to save branch membership settings');
    }

    const data = await res.json();
    if (data) {
      const qrPath = data.qr_image_url || data.qr_code_url || (data.branch_id ? `/member/registration-settings/${data.branch_id}/qr-code` : null);
      if (qrPath) {
        data.qr_display_url = await resolveBranchQrImageUrl(qrPath, data.branch_id);
      }
    }
    return data;
  } catch (error) {
    console.error('membershipSettingsService.createBranchAdminMembershipSettings error:', error);
    throw error;
  }
}

/**
 * PATCH /branch-admin/membership-settings
 * Update the fee, QR image, or both.
 * @param {FormData|Object} payload { membership_fee?: number|string, qr_image?: File }
 */
export async function updateBranchAdminMembershipSettings(payload) {
  try {
    let body = payload;
    if (!(payload instanceof FormData)) {
      body = new FormData();
      if (payload.membership_fee !== undefined && payload.membership_fee !== null) {
        body.append('membership_fee', String(payload.membership_fee));
      }
      if (payload.qr_image) {
        body.append('qr_image', payload.qr_image);
      }
    }

    const res = await fetch(`${BASE_URL}/branch-admin/membership-settings`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(true),
      body,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminStatus(res, errBody, 'Failed to update branch membership settings');
    }

    const data = await res.json();
    if (data) {
      const qrPath = data.qr_image_url || data.qr_code_url || (data.branch_id ? `/member/registration-settings/${data.branch_id}/qr-code` : null);
      if (qrPath) {
        data.qr_display_url = await resolveBranchQrImageUrl(qrPath, data.branch_id);
      }
    }
    return data;
  } catch (error) {
    console.error('membershipSettingsService.updateBranchAdminMembershipSettings error:', error);
    throw error;
  }
}

/* =========================================================================
   2. MEMBER REGISTRATION SETTINGS (Public/Member Facing)
   ========================================================================= */

/**
 * GET /member/registration-settings?branch_id={branch_id}
 * Get the selected branch's membership fee and QR image URL for registration.
 */
export async function getMemberRegistrationSettings(branchId) {
  if (!branchId) return null;
  try {
    const res = await fetch(`${BASE_URL}/member/registration-settings?branch_id=${branchId}`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      // 409 means branch has not configured fee/QR
      if (res.status === 409 || res.status === 404) {
        return {
          configured: false,
          membership_fee: 0,
          qr_code_url: null,
          message: errBody.detail || 'This branch has not configured its membership fee and QR code',
        };
      }
      throw new Error(parseApiError(errBody, res.status, 'Failed to fetch branch registration settings'));
    }

    const data = await res.json();
    let qrDisplayUrl = null;
    const qrPath = data.qr_code_url || data.qr_image_url || `/member/registration-settings/${branchId}/qr-code`;
    if (qrPath) {
      qrDisplayUrl = await resolveBranchQrImageUrl(qrPath, branchId);
    }
    return {
      configured: true,
      ...data,
      qr_code_url: qrDisplayUrl || data.qr_code_url || data.qr_image_url,
      qr_display_url: qrDisplayUrl,
    };
  } catch (error) {
    console.error(`membershipSettingsService.getMemberRegistrationSettings(${branchId}) error:`, error);
    throw error;
  }
}

/**
 * GET /member/registration-settings/{branch_id}/qr-code
 * Fetch the branch's QR image blob/url.
 */
export async function getMemberRegistrationQrCode(branchId) {
  if (!branchId) return null;
  try {
    const res = await fetch(`${BASE_URL}/member/registration-settings/${branchId}/qr-code`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.qr_code_url || json;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`membershipSettingsService.getMemberRegistrationQrCode(${branchId}) error:`, error);
    return null;
  }
}

/**
 * GET /member/staff-code?branch_id={branch_id}&staff_code={staff_code}
 * Lookup staff/agent name by code and branch
 */
export async function lookupMemberStaffCode(branchId, staffCode) {
  if (!branchId || !staffCode) return null;
  const cleanCode = String(staffCode).trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    const res = await fetch(
      `${BASE_URL}/member/staff-code?branch_id=${encodeURIComponent(branchId)}&staff_code=${encodeURIComponent(cleanCode)}`,
      {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      if (res.status === 422) {
        return { notFound: true, message: 'Invalid format (e.g. MAP001)' };
      }
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || 'Failed to verify staff code');
    }

    return await res.json(); // { staff_code, staff_name }
  } catch (error) {
    console.warn(`lookupMemberStaffCode(${branchId}, ${cleanCode}) error:`, error);
    throw error;
  }
}

/* =========================================================================
   3. BRANCH ADMIN MEMBER REGISTRATION APPLICATIONS
   ========================================================================= */

/**
 * GET /branch-admin/member-registration-applications
 * List branch applications, with optional status, search, and pagination filters.
 * @param {Object} params { status, search, skip, limit }
 */
export async function getBranchAdminMemberRegistrationApplications({
  status = null,
  search = '',
  skip = 0,
  limit = 50,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (status && status !== 'all') params.append('status', status.toLowerCase());
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/member-registration-applications${qs}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminStatus(res, errBody, 'Failed to fetch member registration applications');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.applications)) return data.applications;
    return [];
  } catch (error) {
    console.error('membershipSettingsService.getBranchAdminMemberRegistrationApplications error:', error);
    throw error;
  }
}

/**
 * GET /branch-admin/member-registration-applications/{application_id}
 * View one application's submitted details.
 */
export async function getBranchAdminMemberRegistrationApplication(applicationId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/member-registration-applications/${applicationId}`, {
      method: 'GET',
      headers: getBranchAdminHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminStatus(res, errBody, `Failed to fetch application #${applicationId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`membershipSettingsService.getBranchAdminMemberRegistrationApplication(${applicationId}) error:`, error);
    throw error;
  }
}

/**
 * GET /branch-admin/member-registration-applications/{application_id}/documents/{document_name}
 * View an application document or payment screenshot.
 * document_name: 'payment_screenshot' | 'aadhaar_front' | 'aadhaar_back' | 'pan_image' | 'passbook_image'
 */
export async function getBranchAdminMemberRegistrationDocument(applicationId, documentName) {
  try {
    const headers = getBranchAdminHeaders(true);
    const res = await fetch(
      `${BASE_URL}/branch-admin/member-registration-applications/${applicationId}/documents/${encodeURIComponent(documentName)}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminStatus(res, errBody, `Failed to load document: ${documentName}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return json.url || json.document_url || json;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(
      `membershipSettingsService.getBranchAdminMemberRegistrationDocument(${applicationId}, ${documentName}) error:`,
      error
    );
    throw error;
  }
}

/**
 * PATCH /branch-admin/member-registration-applications/{application_id}/decision
 * Approve or reject a pending application; approval creates the member account and code.
 * @param {number} applicationId
 * @param {Object} payload { status: 'approved'|'rejected', rejection_reason?: string, agent_code?: string }
 */
export async function decideBranchAdminMemberRegistrationApplication(applicationId, {
  status,
  rejection_reason = null,
  agent_code = null,
} = {}) {
  try {
    const body = { status: status.toLowerCase() };
    if (rejection_reason) body.rejection_reason = rejection_reason;
    if (agent_code) body.agent_code = agent_code;

    const res = await fetch(`${BASE_URL}/branch-admin/member-registration-applications/${applicationId}/decision`, {
      method: 'PATCH',
      headers: getBranchAdminHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkBranchAdminStatus(res, errBody, `Failed to record decision for application #${applicationId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(
      `membershipSettingsService.decideBranchAdminMemberRegistrationApplication(${applicationId}) error:`,
      error
    );
    throw error;
  }
}
