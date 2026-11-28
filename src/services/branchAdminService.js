// Branch Admin Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export async function getBranchAdmins() {
  return mockDb.getBranchAdmins();
}

export async function getBranchAdmin(adminId) {
  const list = mockDb.getBranchAdmins();
  return list.find((a) => String(a.id) === String(adminId)) || list[0];
}

export async function createBranchAdmin(data) {
  const list = mockDb.getBranchAdmins();
  const newAdmin = {
    ...data,
    id: Date.now(),
    user_code: `MGR-${Math.floor(100 + Math.random() * 900)}`,
    is_active: true,
  };
  mockDb.saveBranchAdmins([newAdmin, ...list]);
  return newAdmin;
}

export async function updateBranchAdmin(adminId, data) {
  const list = mockDb.getBranchAdmins();
  const updated = list.map((a) => (String(a.id) === String(adminId) ? { ...a, ...data } : a));
  mockDb.saveBranchAdmins(updated);
  return updated.find((a) => String(a.id) === String(adminId));
}

export async function deleteBranchAdmin(adminId) {
  const list = mockDb.getBranchAdmins();
  mockDb.saveBranchAdmins(list.filter((a) => String(a.id) !== String(adminId)));
  return { success: true };
}

export async function unlockBranchAdmin(adminId) {
  return updateBranchAdmin(adminId, { is_locked: false });
}

export async function changeBranchAdminStatus(adminId, isActive) {
  return updateBranchAdmin(adminId, { is_active: Boolean(isActive) });
}

export async function branchAdminLogin(managerId, password) {
  const branchUser = {
    id: 1,
    user_code: managerId || 'MGR-001',
    name: 'Anand V',
    full_name: 'Anand V (Branch Manager)',
    role: 'branch_manager',
    branch_id: 1,
    branch_name: 'Kozhikode North Agro Hub',
    branch_code: 'KN-01',
    location: 'Kozhikode, Kerala',
    branch: {
      id: 1,
      name: 'Kozhikode North Agro Hub',
      branch_name: 'Kozhikode North Agro Hub',
      branch_code: 'KN-01',
      city: 'Kozhikode',
      state: 'Kerala',
    },
  };
  localStorage.setItem('branch_token', 'demo-branch-token');
  localStorage.setItem('token', 'demo-branch-token');
  localStorage.setItem('access_token', 'demo-branch-token');
  localStorage.setItem('branch_user', JSON.stringify(branchUser));
  localStorage.setItem('branch_manager_user', JSON.stringify(branchUser));
  return { access_token: 'demo-branch-token', user: branchUser };
}

export async function getBranchAdminMe() {
  const cached = localStorage.getItem('branch_user');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return mockDb.getBranchAdmins()[0];
}

export async function getBranchAdminMembers() {
  return mockDb.getMembers();
}

export async function getBranchAdminMember(memberId) {
  const list = mockDb.getMembers();
  return list.find((m) => String(m.id) === String(memberId)) || list[0];
}

export async function getBranchAdminMemberDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Member+KYC+Document' };
}

export async function reviewBranchAdminMember(memberId, decision, rejectionReason = '') {
  const list = mockDb.getMembers();
  const updated = list.map((m) => {
    if (String(m.id) === String(memberId)) {
      return {
        ...m,
        status: decision,
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
      };
    }
    return m;
  });
  mockDb.saveMembers(updated);
  return { success: true };
}

export async function changeBranchAdminMemberActive(memberId, isActive) {
  const list = mockDb.getMembers();
  const updated = list.map((m) => (String(m.id) === String(memberId) ? { ...m, is_active: Boolean(isActive) } : m));
  mockDb.saveMembers(updated);
  return { success: true };
}

export async function resetBranchAdminMemberPassword() {
  return { message: 'Member password reset link sent to registered email' };
}

export async function unlockBranchAdminMember() {
  return { message: 'Member account unlocked successfully' };
}

export async function getBranchAdminNominees() {
  return [
    {
      id: 1,
      member_id: 183188,
      member_name: 'Manu Sharma',
      nominee_name: 'Ananya Sharma',
      relation: 'Spouse',
      relationship: 'Spouse',
      phone: '9876543219',
      allocation_percentage: 100,
      status: 'approved',
    },
    {
      id: 2,
      member_id: 183189,
      member_name: 'Rajesh Kumar',
      nominee_name: 'Sunita Kumar',
      relation: 'Mother',
      relationship: 'Mother',
      phone: '9876543220',
      allocation_percentage: 100,
      status: 'approved',
    },
  ];
}

export async function getBranchAdminNominee(id) {
  const list = await getBranchAdminNominees();
  return list.find((n) => String(n.id) === String(id)) || list[0];
}

export async function getBranchAdminNomineeDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Nominee+Verification+Document' };
}

export async function reviewBranchAdminNominee() {
  return { success: true };
}

export async function getBranchAdminLoanSchemes() {
  return mockDb.getLoanSchemes();
}

export async function getBranchAdminStaffRoles() {
  return mockDb.getStaffRoles();
}

export async function getBranchAdminSavingsSchemes() {
  return mockDb.getSavingsSchemes();
}

export async function getBranchAdminFdMisSchemes() {
  return mockDb.getFdMisSchemes();
}

export {
  getBranchAdminAnnouncements,
} from './announcementService';

export {
  getBranchAdminServiceRequests,
  getBranchAdminServiceRequest,
  replyToBranchServiceRequest,
  editBranchServiceRequestReply,
  updateBranchServiceRequestStatus,
} from './serviceRequestService';

