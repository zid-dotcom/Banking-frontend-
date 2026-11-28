// Branch Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function getRoleFromLocation() {
  const p = window.location.pathname;
  if (p.startsWith('/member/') || p === '/member-login' || p === '/member/login') {
    return 'member';
  }
  if (p.startsWith('/branch-manager/') || p.startsWith('/branch-admin/') || p === '/branch-manager-login') {
    return 'branch_manager';
  }
  if (p.startsWith('/staff/') || p === '/staff-login' || p === '/staff/login') {
    return 'staff';
  }
  return 'super_admin';
}

export function isTokenExpiredError() {
  return false;
}

export function handleAuthExpired() {
  // In demo mode, do not force-logout
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  if (typeof errBody === 'string') return errBody;
  if (errBody?.message) return errBody.message;
  if (errBody?.detail) return typeof errBody.detail === 'string' ? errBody.detail : JSON.stringify(errBody.detail);
  return fallbackMessage;
}

export async function getBranches() {
  return mockDb.getBranches();
}

export async function getBranch(branchId) {
  const list = mockDb.getBranches();
  const b = list.find((item) => String(item.id) === String(branchId));
  return b || list[0];
}

export async function createBranch(branchData) {
  const list = mockDb.getBranches();
  const newId = list.length > 0 ? Math.max(...list.map((b) => b.id || 0)) + 1 : 1;
  const newBranch = {
    ...branchData,
    id: newId,
    name: branchData.branch_name || branchData.name || 'New Branch',
    branch_name: branchData.branch_name || branchData.name || 'New Branch',
    branch_code: branchData.branch_code || `BRA-0${newId}`,
    is_active: branchData.is_active !== false,
    total_members: 0,
    created_at: new Date().toISOString(),
  };
  const updated = [newBranch, ...list];
  mockDb.saveBranches(updated);
  return newBranch;
}

export async function updateBranch(branchId, branchData) {
  const list = mockDb.getBranches();
  const updated = list.map((b) => {
    if (String(b.id) === String(branchId)) {
      return { ...b, ...branchData };
    }
    return b;
  });
  mockDb.saveBranches(updated);
  return updated.find((b) => String(b.id) === String(branchId));
}

export async function deleteBranch(branchId) {
  const list = mockDb.getBranches();
  const updated = list.filter((b) => String(b.id) !== String(branchId));
  mockDb.saveBranches(updated);
  return { success: true };
}

export async function changeBranchStatus(branchId, isActive) {
  return updateBranch(branchId, { is_active: Boolean(isActive) });
}

export { getSuperAdminMemberCashTransactions } from './cashTransactionService';
