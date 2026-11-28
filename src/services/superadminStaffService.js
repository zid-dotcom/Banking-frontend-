// Superadmin Staff Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export async function listSuperAdminStaff() {
  return mockDb.getStaffMembers();
}

export async function getSuperAdminStaffMember(id) {
  const list = mockDb.getStaffMembers();
  return list.find((s) => String(s.id) === String(id)) || list[0];
}

export async function createSuperAdminStaff(data) {
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

export async function updateSuperAdminStaff(id, data) {
  const list = mockDb.getStaffMembers();
  const updated = list.map((s) => (String(s.id) === String(id) ? { ...s, ...data } : s));
  mockDb.saveStaffMembers(updated);
  return updated.find((s) => String(s.id) === String(id));
}

export async function toggleSuperAdminStaffStatus(id, isActive) {
  return updateSuperAdminStaff(id, { is_active: Boolean(isActive) });
}

export async function deleteSuperAdminStaff(id) {
  const list = mockDb.getStaffMembers();
  mockDb.saveStaffMembers(list.filter((s) => String(s.id) !== String(id)));
  return { success: true };
}
