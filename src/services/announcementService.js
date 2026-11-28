// Announcement Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getAnnouncements() {
  return mockDb.getAnnouncements();
}

export async function getAnnouncement(id) {
  const list = mockDb.getAnnouncements();
  return list.find((a) => String(a.id) === String(id)) || list[0];
}

export async function createAnnouncement(data) {
  const list = mockDb.getAnnouncements();
  const item = {
    ...data,
    id: Date.now(),
    status: 'published',
    created_at: new Date().toISOString(),
  };
  mockDb.saveAnnouncements([item, ...list]);
  return item;
}

export async function updateAnnouncement(id, data) {
  const list = mockDb.getAnnouncements();
  const updated = list.map((a) => (String(a.id) === String(id) ? { ...a, ...data } : a));
  mockDb.saveAnnouncements(updated);
  return updated.find((a) => String(a.id) === String(id));
}

export async function deleteAnnouncement(id) {
  const list = mockDb.getAnnouncements();
  mockDb.saveAnnouncements(list.filter((a) => String(a.id) !== String(id)));
  return { success: true };
}

export async function changeAnnouncementStatus(id, status) {
  return updateAnnouncement(id, { status });
}

export async function getMemberAnnouncements() {
  return mockDb.getAnnouncements().filter((a) => a.audience === 'all' || a.audience === 'members');
}

export async function getBranchAdminAnnouncements() {
  return mockDb.getAnnouncements();
}

export async function getStaffAnnouncements() {
  return mockDb.getAnnouncements().filter((a) => a.audience === 'all' || a.audience === 'staff');
}
