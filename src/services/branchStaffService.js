// Branch Staff Service - Demo Mode (Offline Mock)
import { mockDb, initialStaffRoles } from './mockData';

export const DEFAULT_STAFF_ROLES = initialStaffRoles;

export async function getBranchAdminStaffRoles() {
  return mockDb.getStaffRoles();
}

export async function getAvailableStaffRoles() {
  return mockDb.getStaffRoles();
}

export async function getBranchStaff() {
  return mockDb.getStaffMembers();
}

export async function getBranchStaffMember(staffId) {
  const list = mockDb.getStaffMembers();
  return list.find((s) => String(s.id) === String(staffId)) || list[0];
}

export async function createBranchStaff(data) {
  const list = mockDb.getStaffMembers();
  const newStaff = {
    ...data,
    id: Date.now(),
    user_code: `STF-${Math.floor(100 + Math.random() * 900)}`,
    staff_code: `STF-${Math.floor(100 + Math.random() * 900)}`,
    is_active: true,
  };
  mockDb.saveStaffMembers([newStaff, ...list]);
  return newStaff;
}

export async function updateBranchStaff(staffId, data) {
  const list = mockDb.getStaffMembers();
  const updated = list.map((s) => (String(s.id) === String(staffId) ? { ...s, ...data } : s));
  mockDb.saveStaffMembers(updated);
  return updated.find((s) => String(s.id) === String(staffId));
}

export async function deleteBranchStaff(staffId) {
  const list = mockDb.getStaffMembers();
  mockDb.saveStaffMembers(list.filter((s) => String(s.id) !== String(staffId)));
  return { success: true };
}

export async function changeBranchStaffStatus(staffId, isActive) {
  return updateBranchStaff(staffId, { is_active: Boolean(isActive) });
}

export async function staffLogin(staffId, password) {
  const staffUser = {
    id: 1,
    user_code: staffId || 'STF-001',
    staff_code: staffId || 'STF-001',
    name: 'Rahul Nair',
    full_name: 'Rahul Nair',
    email: 'rahul.staff@aurumfx.com',
    role: 'staff',
    account_role: 'staff',
    staff_role: {
      id: 1,
      name: 'Cashier & Teller',
      role_name: 'Cashier & Teller',
    },
    branch_id: 1,
    branch_name: 'Kozhikode North Agro Hub',
    branch_code: 'KN-01',
  };
  localStorage.setItem('staff_token', 'demo-staff-token');
  localStorage.setItem('token', 'demo-staff-token');
  localStorage.setItem('access_token', 'demo-staff-token');
  localStorage.setItem('staff_user', JSON.stringify(staffUser));
  return { access_token: 'demo-staff-token', user: staffUser };
}

export async function getStaffMe() {
  const cached = localStorage.getItem('staff_user');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return mockDb.getStaffMembers()[0];
}
