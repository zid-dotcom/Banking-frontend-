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
 * 1. GET /superadmin/branches - List all branches
 */
export async function getBranches() {
  try {
    const res = await fetch(`${BASE_URL}/superadmin/branches`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch branches: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // Return array safely if wrapped in an object like { branches: [...] } or { data: [...] }
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
      throw new Error(`Failed to fetch branch #${branchId}: ${res.status} ${res.statusText}`);
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
      throw new Error(errBody.detail || errBody.message || `Failed to create branch (${res.status})`);
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
      throw new Error(errBody.detail || errBody.message || `Failed to update branch (${res.status})`);
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
      throw new Error(errBody.detail || errBody.message || `Failed to delete branch (${res.status})`);
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
      throw new Error(errBody.detail || errBody.message || `Failed to change status (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error(`branchService.changeBranchStatus(${branchId}) error:`, error);
    throw error;
  }
}

