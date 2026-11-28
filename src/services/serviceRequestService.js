// Service Request Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function createMemberServiceRequest(data) {
  const list = mockDb.getServiceRequests();
  const newReq = {
    ...data,
    id: Date.now(),
    request_number: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'in_progress',
    created_at: new Date().toISOString(),
    replies: [],
  };
  mockDb.saveServiceRequests([newReq, ...list]);
  return newReq;
}

export async function getMemberServiceRequests() {
  return mockDb.getServiceRequests();
}

export async function getMemberServiceRequest(id) {
  const list = mockDb.getServiceRequests();
  return list.find((r) => String(r.id) === String(id)) || list[0];
}

export async function getBranchAdminServiceRequests() {
  return mockDb.getServiceRequests();
}

export async function getBranchAdminServiceRequest(id) {
  return getMemberServiceRequest(id);
}

export async function replyToBranchServiceRequest(id, message) {
  const list = mockDb.getServiceRequests();
  const req = list.find((r) => String(r.id) === String(id));
  if (req) {
    if (!req.replies) req.replies = [];
    req.replies.push({
      id: Date.now(),
      author: 'Branch Manager',
      message: typeof message === 'string' ? message : message.message,
      created_at: new Date().toISOString(),
    });
    mockDb.saveServiceRequests(list);
  }
  return { success: true };
}

export async function editBranchServiceRequestReply() {
  return { success: true };
}

export async function updateBranchServiceRequestStatus(id, status) {
  const list = mockDb.getServiceRequests();
  const updated = list.map((r) => (String(r.id) === String(id) ? { ...r, status } : r));
  mockDb.saveServiceRequests(updated);
  return { success: true };
}

export async function getSuperAdminServiceRequests() {
  return mockDb.getServiceRequests();
}

export async function getSuperAdminServiceRequest(id) {
  return getMemberServiceRequest(id);
}

export async function replyToSuperAdminServiceRequest(id, message) {
  return replyToBranchServiceRequest(id, message);
}

export async function editSuperAdminServiceRequestReply() {
  return { success: true };
}

export async function updateSuperAdminServiceRequestStatus(id, status) {
  return updateBranchServiceRequestStatus(id, status);
}

export async function getStaffCustomerServiceRequests() {
  return mockDb.getServiceRequests();
}

export async function getStaffCustomerServicePendingCount() {
  return 1;
}

export async function getStaffCustomerServiceRequest(id) {
  return getMemberServiceRequest(id);
}

export async function replyToStaffCustomerServiceRequest(id, message) {
  return replyToBranchServiceRequest(id, message);
}

export async function updateStaffCustomerServiceRequestStatus(id, status) {
  return updateBranchServiceRequestStatus(id, status);
}
