// Accountant Member Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export async function listAccountantMembers() {
  return mockDb.getMembers();
}

export async function getAccountantMember(id) {
  const list = mockDb.getMembers();
  return list.find((m) => String(m.id) === String(id)) || list[0];
}

export async function getAccountantMemberCashTransactions() {
  return [];
}

export async function getAccountantMemberDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Accountant+Verified+KYC' };
}
