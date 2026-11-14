// Branch Admin - Staff API Service connecting to /branch-admin/staff endpoints
import { parseApiError, handleAuthExpired } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

/**
 * Standard request headers for Branch Admin endpoints
 */
function getHeaders() {
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

/**
 * Common / Seeded staff roles for fallback only
 */
export const DEFAULT_STAFF_ROLES = [
  { id: 1, name: 'Branch Operations Officer' },
  { id: 2, name: 'Cashier / Teller' },
  { id: 3, name: 'Loan Field Officer' },
  { id: 4, name: 'Customer Service Representative' },
  { id: 5, name: 'Accountant / Auditor' },
];

/**
 * 0. GET /branch-admin/staff-roles - List Available Staff Roles
 * Calls the dedicated branch admin endpoint using branch_token
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
      checkResponseStatus(res, errBody, 'Failed to fetch branch staff roles');
    }

    const data = await res.json();
    let rawList = [];
    if (Array.isArray(data)) rawList = data;
    else if (Array.isArray(data.items)) rawList = data.items;
    else if (Array.isArray(data.roles)) rawList = data.roles;
    else if (Array.isArray(data.data)) rawList = data.data;

    const normalized = rawList.map((r) => ({
      id: Number(r.id !== undefined ? r.id : r.role_id),
      name: r.name || r.role_name || r.title || `Role #${r.id}`,
      description: r.description || '',
      is_active: r.is_active !== false,
      created_at: r.created_at,
      ...r,
    }));

    if (normalized.length > 0) {
      try {
        localStorage.setItem('cached_branch_staff_roles', JSON.stringify(normalized));
      } catch {}
    }

    return normalized;
  } catch (error) {
    console.error('branchStaffService.getBranchAdminStaffRoles error:', error);
    // If API fails, try to return cached branch staff roles if present
    try {
      const cached = localStorage.getItem('cached_branch_staff_roles');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    throw error;
  }
}

/**
 * Retrieve cached or available staff roles safely without calling restricted superadmin endpoints
 */
export function getAvailableStaffRoles(currentStaffList = []) {
  const roleMap = new Map();

  // 1. Cached roles from GET /branch-admin/staff-roles
  try {
    const cached = localStorage.getItem('cached_branch_staff_roles');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        parsed.forEach((r) => {
          if (r.id) {
            roleMap.set(Number(r.id), {
              id: Number(r.id),
              name: r.name || r.role_name || `Role #${r.id}`,
            });
          }
        });
      }
    }
  } catch {}

  // 2. Roles dynamically discovered from fetched branch staff records
  if (Array.isArray(currentStaffList)) {
    currentStaffList.forEach((s) => {
      if (s.staff_role_id) {
        const roleId = Number(s.staff_role_id);
        if (!roleMap.has(roleId)) {
          roleMap.set(roleId, {
            id: roleId,
            name: s.staff_role_name || `Role #${roleId}`,
          });
        }
      }
    });
  }

  // 3. Fallback only if no roles were ever loaded
  if (roleMap.size === 0) {
    DEFAULT_STAFF_ROLES.forEach((r) => {
      roleMap.set(r.id, r);
    });
  }

  return Array.from(roleMap.values());
}

/**
 * Validates HTTP response status and handles token expirations
 */
function checkResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  const isExpired =
    res.status === 401 ||
    parsedMsg.toLowerCase().includes('expired token') ||
    parsedMsg.toLowerCase().includes('invalid or expired') ||
    parsedMsg.toLowerCase().includes('token has expired');

  if (isExpired) {
    if (window.location.pathname.startsWith('/branch-manager/') || window.location.pathname.startsWith('/branch-admin/')) {
      handleAuthExpired('branch_manager');
    }
    throw new Error('Session has expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /branch-admin/staff - List Staff
 * Query parameters: skip, limit, staff_role_id, is_active, search
 */
export async function getBranchStaff({
  skip = 0,
  limit = 50,
  staff_role_id = null,
  is_active = null,
  search = ''
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (staff_role_id !== undefined && staff_role_id !== null && staff_role_id !== 'all') {
      params.append('staff_role_id', String(staff_role_id));
    }
    if (is_active !== undefined && is_active !== null && is_active !== 'all') {
      params.append('is_active', String(is_active));
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/branch-admin/staff${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch branch staff list');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.staff)) return data.staff;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('branchStaffService.getBranchStaff error:', error);
    throw error;
  }
}

/**
 * 2. GET /branch-admin/staff/{staff_id} - Get Specific Staff Member
 */
export async function getBranchStaffMember(staffId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/staff/${staffId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch staff member #${staffId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchStaffService.getBranchStaffMember(${staffId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /branch-admin/staff - Create Staff Member
 * Schema: { full_name, email, password, contact_number, address, staff_role_id }
 */
export async function createBranchStaff(staffData) {
  try {
    const payload = {
      full_name: staffData.full_name?.trim(),
      email: staffData.email?.trim()?.toLowerCase(),
      password: staffData.password,
      contact_number: staffData.contact_number?.trim(),
      address: staffData.address?.trim(),
      staff_role_id: Number(staffData.staff_role_id),
    };

    const res = await fetch(`${BASE_URL}/branch-admin/staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to create staff member');
    }

    return await res.json();
  } catch (error) {
    console.error('branchStaffService.createBranchStaff error:', error);
    throw error;
  }
}

/**
 * 4. PUT /branch-admin/staff/{staff_id} - Update Staff Member
 * Schema: { full_name?, email?, password?, contact_number?, address?, staff_role_id? }
 */
export async function updateBranchStaff(staffId, staffData) {
  try {
    const payload = {};
    if (staffData.full_name !== undefined) payload.full_name = staffData.full_name?.trim();
    if (staffData.email !== undefined) payload.email = staffData.email?.trim()?.toLowerCase();
    if (staffData.contact_number !== undefined) payload.contact_number = staffData.contact_number?.trim();
    if (staffData.address !== undefined) payload.address = staffData.address?.trim();
    if (staffData.staff_role_id !== undefined && staffData.staff_role_id !== '') {
      payload.staff_role_id = Number(staffData.staff_role_id);
    }
    if (staffData.password && staffData.password.trim()) {
      payload.password = staffData.password;
    }

    const res = await fetch(`${BASE_URL}/branch-admin/staff/${staffId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update staff member #${staffId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchStaffService.updateBranchStaff(${staffId}) error:`, error);
    throw error;
  }
}

/**
 * 5. DELETE /branch-admin/staff/{staff_id} - Delete Staff Member
 */
export async function deleteBranchStaff(staffId) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/staff/${staffId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete staff member #${staffId}`);
    }

    return await res.json().catch(() => ({ success: true }));
  } catch (error) {
    console.error(`branchStaffService.deleteBranchStaff(${staffId}) error:`, error);
    throw error;
  }
}

/**
 * 6. PATCH /branch-admin/staff/{staff_id}/status - Change Staff Active Status
 * Schema: { is_active: boolean }
 */
export async function changeBranchStaffStatus(staffId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/branch-admin/staff/${staffId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to change status of staff #${staffId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchStaffService.changeBranchStaffStatus(${staffId}) error:`, error);
    throw error;
  }
}

