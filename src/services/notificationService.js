// Notification Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export const NOTIFICATIONS_UPDATED_EVENT = 'aurumfx:notifications_updated';

export function getAuthHeaders() {
  return {};
}

export function getSuperAdminHeaders() { return {}; }
export function getBranchAdminHeaders() { return {}; }
export function getStaffHeaders() { return {}; }
export function getMemberHeaders() { return {}; }

export function getNotificationBasePath() {
  return '/notifications';
}

export function notifyNotificationsUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export async function fetchNotificationsForRole() {
  return mockDb.getNotifications();
}

export async function fetchUnreadCountForRole() {
  const list = mockDb.getNotifications();
  return list.filter((n) => !n.is_read).length;
}

export async function markNotificationReadForRole(id) {
  const list = mockDb.getNotifications();
  const updated = list.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n));
  mockDb.saveNotifications(updated);
  notifyNotificationsUpdated();
  return { success: true };
}

export async function markAllNotificationsReadForRole() {
  const list = mockDb.getNotifications();
  const updated = list.map((n) => ({ ...n, is_read: true }));
  mockDb.saveNotifications(updated);
  notifyNotificationsUpdated();
  return { success: true };
}

// Role specific wrappers
export const getStaffNotifications = fetchNotificationsForRole;
export const getStaffUnreadCount = fetchUnreadCountForRole;
export const markStaffNotificationRead = markNotificationReadForRole;
export const markStaffAllNotificationsRead = markAllNotificationsReadForRole;

export const getBranchAdminNotifications = fetchNotificationsForRole;
export const getBranchAdminUnreadCount = fetchUnreadCountForRole;
export const markBranchAdminNotificationRead = markNotificationReadForRole;
export const markBranchAdminAllNotificationsRead = markAllNotificationsReadForRole;

export const getSuperAdminNotifications = fetchNotificationsForRole;
export const getSuperAdminUnreadCount = fetchUnreadCountForRole;
export const markSuperAdminNotificationRead = markNotificationReadForRole;
export const markSuperAdminAllNotificationsRead = markAllNotificationsReadForRole;

export const getMemberNotifications = fetchNotificationsForRole;
export const getMemberUnreadCount = fetchUnreadCountForRole;
export const markNotificationRead = markNotificationReadForRole;
export const markMemberNotificationRead = markNotificationReadForRole;
export const markAllNotificationsRead = markAllNotificationsReadForRole;
export const markMemberAllNotificationsRead = markAllNotificationsReadForRole;
