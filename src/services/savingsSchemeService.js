// Savings Scheme Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function handleAuthExpired() {
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getSavingsSchemes() {
  return mockDb.getSavingsSchemes();
}

export async function getSavingsScheme(schemeId) {
  const list = mockDb.getSavingsSchemes();
  return list.find((s) => String(s.id) === String(schemeId)) || list[0];
}

export async function createSavingsScheme(schemeData) {
  const list = mockDb.getSavingsSchemes();
  const newScheme = {
    ...schemeData,
    id: Date.now(),
    scheme_code: schemeData.scheme_code || `SCH0${Math.floor(1000 + Math.random() * 9000)}`,
    is_active: schemeData.is_active !== false,
    created_at: new Date().toISOString(),
  };
  mockDb.saveSavingsSchemes([newScheme, ...list]);
  return newScheme;
}

export async function updateSavingsScheme(schemeId, schemeData) {
  const list = mockDb.getSavingsSchemes();
  const updated = list.map((s) => (String(s.id) === String(schemeId) ? { ...s, ...schemeData } : s));
  mockDb.saveSavingsSchemes(updated);
  return updated.find((s) => String(s.id) === String(schemeId));
}

export async function deleteSavingsScheme(schemeId) {
  const list = mockDb.getSavingsSchemes();
  mockDb.saveSavingsSchemes(list.filter((s) => String(s.id) !== String(schemeId)));
  return { success: true };
}

export async function changeSavingsSchemeStatus(schemeId, isActive) {
  return updateSavingsScheme(schemeId, { is_active: Boolean(isActive) });
}

export async function getBranchAdminSavingsSchemes() {
  return mockDb.getSavingsSchemes();
}

export async function getMemberSavingsSchemes() {
  return mockDb.getSavingsSchemes().filter((s) => s.is_active !== false);
}

export async function getMemberSavingsAccounts() {
  return [
    {
      id: 1,
      account_number: 'AFX-SAV-992014',
      scheme_name: 'Regular Member Savings Deposit',
      balance: 24500,
      currency: 'INR',
      status: 'active',
      opened_at: '2025-01-15T10:00:00.000Z',
    },
  ];
}

export * from './savingsAccountService';
