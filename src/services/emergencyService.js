// Emergency Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export const EMERGENCY_UNREAD_UPDATED_EVENT = 'aurumfx:emergency_unread_updated';

export function notifyEmergencyUnreadUpdated() {
  window.dispatchEvent(new Event(EMERGENCY_UNREAD_UPDATED_EVENT));
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function createBranchAdminEmergencyCase(data) {
  return { success: true, case: data };
}

export async function getBranchAdminEmergencyCases() {
  return mockDb.getEmergencyCases();
}

export async function getBranchAdminEmergencyUnreadCount() {
  return 0;
}

export async function getBranchAdminEmergencyCase(id) {
  const list = mockDb.getEmergencyCases();
  return list.find((c) => String(c.id) === String(id)) || list[0];
}

export async function sendBranchAdminEmergencyMessage() {
  return { success: true };
}

export async function getSuperadminEmergencyCases() {
  return mockDb.getEmergencyCases();
}

export async function getSuperadminEmergencyUnreadCount() {
  return 0;
}

export async function getSuperadminEmergencyCase(id) {
  return getBranchAdminEmergencyCase(id);
}

export async function sendSuperadminEmergencyMessage() {
  return { success: true };
}
