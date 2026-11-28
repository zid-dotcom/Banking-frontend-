// Loan Scheme Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function handleAuthExpired() {
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getLoanSchemes() {
  return mockDb.getLoanSchemes();
}

export async function getLoanScheme(schemeId) {
  const list = mockDb.getLoanSchemes();
  return list.find((s) => String(s.id) === String(schemeId)) || list[0];
}

export async function createLoanScheme(schemeData) {
  const list = mockDb.getLoanSchemes();
  const newScheme = {
    ...schemeData,
    id: Date.now(),
    scheme_code: schemeData.scheme_code || `LN-${Math.floor(100 + Math.random() * 900)}`,
    is_active: schemeData.is_active !== false,
    created_at: new Date().toISOString(),
  };
  mockDb.saveLoanSchemes([newScheme, ...list]);
  return newScheme;
}

export async function updateLoanScheme(schemeId, schemeData) {
  const list = mockDb.getLoanSchemes();
  const updated = list.map((s) => (String(s.id) === String(schemeId) ? { ...s, ...schemeData } : s));
  mockDb.saveLoanSchemes(updated);
  return updated.find((s) => String(s.id) === String(schemeId));
}

export async function deleteLoanScheme(schemeId) {
  const list = mockDb.getLoanSchemes();
  mockDb.saveLoanSchemes(list.filter((s) => String(s.id) !== String(schemeId)));
  return { success: true };
}

export async function changeLoanSchemeStatus(schemeId, isActive) {
  return updateLoanScheme(schemeId, { is_active: Boolean(isActive) });
}

export async function getBranchAdminLoanSchemes() {
  return mockDb.getLoanSchemes();
}

export async function getMemberLoanSchemes() {
  return mockDb.getLoanSchemes().filter((s) => s.is_active !== false);
}

const loanSchemeService = {
  getLoanSchemes,
  getLoanScheme,
  createLoanScheme,
  updateLoanScheme,
  deleteLoanScheme,
  changeLoanSchemeStatus,
  getBranchAdminLoanSchemes,
  getMemberLoanSchemes,
};

export default loanSchemeService;
