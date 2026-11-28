// Staff Role Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function handleAuthExpired() {
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getStaffRoles() {
  return mockDb.getStaffRoles();
}

export async function createStaffRole(data) {
  const list = mockDb.getStaffRoles();
  const newRole = {
    ...data,
    id: Date.now(),
  };
  mockDb.saveStaffRoles([newRole, ...list]);
  return newRole;
}

export async function deleteStaffRole(roleId) {
  const list = mockDb.getStaffRoles();
  mockDb.saveStaffRoles(list.filter((r) => String(r.id) !== String(roleId)));
  return { success: true };
}
