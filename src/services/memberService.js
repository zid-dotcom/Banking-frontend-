// Member Service - Demo Mode (Offline Mock)
import { mockDb, initialMembers } from './mockData';

export const NOTIFICATIONS_UPDATED_EVENT = 'aurumfx:notifications_updated';

export async function getMemberUnreadCount() {
  return 2;
}

export async function getSuperadminBranchMembers() {
  return mockDb.getMembers();
}

export async function getSuperadminBranchMember(memberId) {
  const list = mockDb.getMembers();
  return list.find((m) => String(m.id) === String(memberId)) || list[0];
}

export async function getSuperadminMemberDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Member+KYC+Document' };
}

export async function getSuperadminMemberNomineeDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Nominee+KYC+Document' };
}

export async function getMemberBranches() {
  return mockDb.getBranches();
}

export async function memberLogin({ username, password }) {
  const memberUser = {
    id: 183188,
    user_code: username || 'MEM-183188',
    member_code: username ? username.replace(/\D/g, '') || '183188' : '183188',
    name: 'Manu Sharma',
    full_name: 'Manu Sharma',
    email: 'manu@aurumfx.com',
    phone: '9876543210',
    role: 'member',
    account_role: 'member',
    branch_id: 1,
    branch_name: 'Kozhikode North Agro Hub',
    branch_code: 'KN-01',
    is_active: true,
  };
  localStorage.setItem('member_token', 'demo-member-token');
  localStorage.setItem('token', 'demo-member-token');
  localStorage.setItem('access_token', 'demo-member-token');
  localStorage.setItem('member_user', JSON.stringify(memberUser));
  return { access_token: 'demo-member-token', user: memberUser };
}

export async function getMemberMe() {
  const cached = localStorage.getItem('member_user');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }
  return initialMembers[0];
}

export async function getMemberFullProfile() {
  return {
    ...initialMembers[0],
    father_name: 'Ramesh Sharma',
    mother_name: 'Sita Sharma',
    dob: '1988-06-14',
    gender: 'Male',
    marital_status: 'Married',
    occupation: 'Organic Farmer',
    address_line_1: 'Plot 44, Agro Green Valley',
    address_line_2: 'Near Mavoor River Bank',
    city: 'Kozhikode',
    state: 'Kerala',
    pincode: '673001',
    pan_number: 'ABCDE1234F',
    aadhaar_number: 'XXXXXXXX1234',
    nominee: {
      name: 'Ananya Sharma',
      relation: 'Spouse',
      phone: '9876543219',
      allocation: 100,
    },
  };
}

export async function getMemberProfileDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Member+Verified+Identity' };
}

export async function downloadMemberProfileDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Member+Downloadable+KYC' };
}

export async function registerMember(formData) {
  const list = mockDb.getMembers();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const newMember = {
    id: Date.now(),
    user_code: `MEM-${code}`,
    member_code: code,
    full_name: formData.full_name || formData.name || 'New Member',
    name: formData.full_name || formData.name || 'New Member',
    phone: formData.phone || '9876543210',
    email: formData.email || 'member@aurumfx.com',
    branch_id: formData.branch_id || 1,
    branch_name: 'Kozhikode North Agro Hub',
    status: 'pending',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  mockDb.saveMembers([newMember, ...list]);
  return {
    success: true,
    message: 'Member registration submitted successfully in demo mode.',
    member_code: code,
    member: newMember,
  };
}

export async function reapplyMember(formData) {
  return registerMember(formData);
}

export async function getAccountantMember(memberId) {
  const list = mockDb.getMembers();
  return list.find((m) => String(m.id) === String(memberId)) || list[0];
}

export async function getMemberRegistrationSettings(branchId) {
  return {
    membership_fee: 500,
    upi_id: 'aurumfx@upi',
    qr_image_url: 'https://via.placeholder.com/300x300.png?text=Branch+UPI+QR',
    branch_name: 'Kozhikode North Agro Hub',
  };
}

export function resolveBranchQrImageUrl(path) {
  if (!path) return 'https://via.placeholder.com/300x300.png?text=Branch+UPI+QR';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return 'https://via.placeholder.com/300x300.png?text=Branch+UPI+QR';
}

export async function lookupMemberStaffCode(branchId, staffCode) {
  return {
    valid: true,
    name: 'MANILA V V',
    staff_code: staffCode || 'FX009',
    role: 'Senior Agent',
  };
}

export async function getMemberSavingsSchemes() {
  return mockDb.getSavingsSchemes().filter((s) => s.is_active);
}

export async function getMemberNominee() {
  return {
    id: 1,
    nominee_name: 'Ananya Sharma',
    relationship: 'Spouse',
    phone: '9876543219',
    share_percentage: 100,
    status: 'approved',
    date_of_birth: '1992-05-14',
    aadhaar_number: 'XXXX-XXXX-9912',
    address: 'Flat 4B, Hillview Apartments, Calicut',
  };
}

export async function submitMemberNominee(data) {
  return { success: true, message: 'Nominee updated successfully.' };
}

export async function getMemberNomineeDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Nominee+KYC+Document' };
}

export async function downloadMemberNomineeDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Nominee+KYC+Download' };
}

export {
  getMemberAnnouncements,
} from './announcementService';

export {
  getMemberNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notifyNotificationsUpdated,
} from './notificationService';

export {
  getMemberServiceRequests,
  createMemberServiceRequest,
  getMemberServiceRequest,
} from './serviceRequestService';

