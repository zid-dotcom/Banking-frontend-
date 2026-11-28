// Investment Scheme Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function handleAuthExpired() {
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getSuperAdminInvestmentSchemes() {
  return mockDb.getInvestmentSchemes();
}

export async function getSuperAdminInvestmentScheme(schemeId) {
  const list = mockDb.getInvestmentSchemes();
  return list.find((s) => String(s.id) === String(schemeId)) || list[0];
}

export async function createSuperAdminInvestmentScheme(schemeData) {
  const list = mockDb.getInvestmentSchemes();
  const newScheme = {
    ...schemeData,
    id: Date.now(),
    scheme_code: schemeData.scheme_code || `INV-${Math.floor(100 + Math.random() * 900)}`,
    is_active: schemeData.is_active !== false,
    created_at: new Date().toISOString(),
  };
  mockDb.saveInvestmentSchemes([newScheme, ...list]);
  return newScheme;
}

export async function updateSuperAdminInvestmentScheme(schemeId, schemeData) {
  const list = mockDb.getInvestmentSchemes();
  const updated = list.map((s) => (String(s.id) === String(schemeId) ? { ...s, ...schemeData } : s));
  mockDb.saveInvestmentSchemes(updated);
  return updated.find((s) => String(s.id) === String(schemeId));
}

export async function deleteSuperAdminInvestmentScheme(schemeId) {
  const list = mockDb.getInvestmentSchemes();
  mockDb.saveInvestmentSchemes(list.filter((s) => String(s.id) !== String(schemeId)));
  return { success: true };
}

export async function changeSuperAdminInvestmentSchemeStatus(schemeId, isActive) {
  return updateSuperAdminInvestmentScheme(schemeId, { is_active: Boolean(isActive) });
}

export async function getBranchAdminInvestmentSchemes() {
  return mockDb.getInvestmentSchemes();
}

export async function getMemberInvestmentSchemes() {
  return mockDb.getInvestmentSchemes().filter((s) => s.is_active !== false);
}

const investmentSchemeService = {
  getSuperAdminInvestmentSchemes,
  getSuperAdminInvestmentScheme,
  createSuperAdminInvestmentScheme,
  updateSuperAdminInvestmentScheme,
  deleteSuperAdminInvestmentScheme,
  changeSuperAdminInvestmentSchemeStatus,
  getBranchAdminInvestmentSchemes,
  getMemberInvestmentSchemes,
};

export default investmentSchemeService;
