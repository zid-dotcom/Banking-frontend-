import { parseApiError, handleAuthExpired } from './branchService';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://supercriminally-ununified-arnoldo.ngrok-free.dev';

function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json',
  };

  const token =
    localStorage.getItem('superadmin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

function checkResponseStatus(res, errBody, defaultMsg) {
  const parsedMsg = parseApiError(errBody, res.status, defaultMsg);
  const isExpired =
    res.status === 401 ||
    parsedMsg.toLowerCase().includes('expired token') ||
    parsedMsg.toLowerCase().includes('invalid or expired') ||
    parsedMsg.toLowerCase().includes('token has expired');

  if (isExpired) {
    handleAuthExpired('super_admin');
    throw new Error('Session has expired. Please login again.');
  }

  throw new Error(parsedMsg);
}

/**
 * 1. GET /superadmin/staff
 * Filter staff by branch_id, staff_role_id, is_active, search, skip, limit
 */
export async function listSuperAdminStaff({
  branch_id = null,
  staff_role_id = null,
  is_active = null,
  search = '',
  skip = 0,
  limit = 50,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined && skip !== null) params.append('skip', String(skip));
    if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    if (branch_id && branch_id !== 'all') params.append('branch_id', String(branch_id));
    if (staff_role_id && staff_role_id !== 'all') params.append('staff_role_id', String(staff_role_id));
    if (is_active !== null && is_active !== undefined && is_active !== 'all') {
      params.append('is_active', String(is_active));
    }
    if (search && search.trim()) params.append('search', search.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/superadmin/staff${qs}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, 'Failed to fetch staff list');
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.staff)) return data.staff;
    if (Array.isArray(data.data)) return data.data;
    return [];
  } catch (error) {
    console.error('superadminStaffService.listSuperAdminStaff error:', error);
    throw error;
  }
}

/**
 * 2. GET /superadmin/staff/{staff_id}
 * Retrieve specific staff member
 */
export async function getSuperAdminStaffMember(staffId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/staff/${encodeURIComponent(staffId)}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to fetch staff member #${staffId}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`superadminStaffService.getSuperAdminStaffMember(${staffId}) error:`, error);
    throw error;
  }
}

/**
 * 3. POST /superadmin/staff
 * Create a new staff member under a specified branch
 */
export async function createSuperAdminStaff(staffData) {
  try {
    const payload = {
      branch_id: Number(staffData.branch_id),
      staff_role_id: Number(staffData.staff_role_id),
      full_name: staffData.full_name?.trim(),
      email: staffData.email?.trim()?.toLowerCase(),
      password: staffData.password,
      contact_number: staffData.contact_number?.trim(),
      address: staffData.address?.trim(),
    };

    const res = await fetch(`${BASE_URL}/superadmin/staff`, {
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
    console.error('superadminStaffService.createSuperAdminStaff error:', error);
    throw error;
  }
}

/**
 * 4. PUT /superadmin/staff/{staff_id}
 * Update an existing staff member
 */
export async function updateSuperAdminStaff(staffId, staffData) {
  try {
    const payload = {};
    if (staffData.branch_id !== undefined && staffData.branch_id !== null) {
      payload.branch_id = Number(staffData.branch_id);
    }
    if (staffData.staff_role_id !== undefined && staffData.staff_role_id !== null) {
      payload.staff_role_id = Number(staffData.staff_role_id);
    }
    if (staffData.full_name !== undefined) payload.full_name = staffData.full_name?.trim();
    if (staffData.email !== undefined) payload.email = staffData.email?.trim()?.toLowerCase();
    if (staffData.password) payload.password = staffData.password;
    if (staffData.contact_number !== undefined) payload.contact_number = staffData.contact_number?.trim();
    if (staffData.address !== undefined) payload.address = staffData.address?.trim();

    const res = await fetch(`${BASE_URL}/superadmin/staff/${encodeURIComponent(staffId)}`, {
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
    console.error(`superadminStaffService.updateSuperAdminStaff(${staffId}) error:`, error);
    throw error;
  }
}

/**
 * 5. PATCH /superadmin/staff/{staff_id}/status
 * Toggle staff active status: {"is_active": false} / {"is_active": true}
 */
export async function toggleSuperAdminStaffStatus(staffId, isActive) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/staff/${encodeURIComponent(staffId)}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: Boolean(isActive) }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to update staff status`);
    }

    return await res.json();
  } catch (error) {
    console.error(`superadminStaffService.toggleSuperAdminStaffStatus(${staffId}) error:`, error);
    throw error;
  }
}

/**
 * 6. DELETE /superadmin/staff/{staff_id}
 * Delete a staff member
 */
export async function deleteSuperAdminStaff(staffId) {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/staff/${encodeURIComponent(staffId)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      checkResponseStatus(res, errBody, `Failed to delete staff member #${staffId}`);
    }

    return true;
  } catch (error) {
    console.error(`superadminStaffService.deleteSuperAdminStaff(${staffId}) error:`, error);
    throw error;
  }
}
