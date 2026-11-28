// Monthly Target Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function handleAuthExpired() {
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getSuperAdminBranchAdmins() {
  return mockDb.getBranchAdmins();
}

export async function getSuperAdminTargetRoles() {
  return mockDb.getStaffRoles();
}

export async function createSuperAdminMonthlyTarget(data) {
  const list = mockDb.getMonthlyTargets();
  const newTarget = {
    ...data,
    id: Date.now(),
    achieved_amount: 0,
    status: 'in_progress',
  };
  mockDb.saveMonthlyTargets([newTarget, ...list]);
  return newTarget;
}

export async function getSuperAdminMonthlyTargets() {
  return mockDb.getMonthlyTargets();
}

export async function getBranchAdminStaffList() {
  return mockDb.getStaffMembers();
}

export async function createBranchAdminStaffTarget(data) {
  return createSuperAdminMonthlyTarget(data);
}

export async function getBranchAdminMonthlyTargets() {
  return mockDb.getMonthlyTargets();
}

export async function getStaffMonthlyTargetsMe() {
  return mockDb.getMonthlyTargets();
}

const monthlyTargetService = {
  getSuperAdminBranchAdmins,
  getSuperAdminTargetRoles,
  createSuperAdminMonthlyTarget,
  getSuperAdminMonthlyTargets,
  getBranchAdminStaffList,
  createBranchAdminStaffTarget,
  getBranchAdminMonthlyTargets,
  getStaffMonthlyTargetsMe,
  handleAuthExpired,
  parseApiError,
};

export default monthlyTargetService;

