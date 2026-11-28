// FD & MIS Scheme Service - Demo Mode (Offline Mock)
import { mockDb } from './mockData';

export function handleAuthExpired() {
  console.info('Demo Mode: Session active');
}

export function parseApiError(errBody, status, fallbackMessage = 'Operation completed') {
  return errBody?.message || fallbackMessage;
}

export async function getFdMisSchemes() {
  return mockDb.getFdMisSchemes();
}

export async function getFdMisScheme(schemeId) {
  const list = mockDb.getFdMisSchemes();
  return list.find((s) => String(s.id) === String(schemeId)) || list[0];
}

export async function createFdMisScheme(schemeData) {
  const list = mockDb.getFdMisSchemes();
  const newScheme = {
    ...schemeData,
    id: Date.now(),
    scheme_code: schemeData.scheme_code || `FD-${Math.floor(100 + Math.random() * 900)}`,
    is_active: schemeData.is_active !== false,
    created_at: new Date().toISOString(),
  };
  mockDb.saveFdMisSchemes([newScheme, ...list]);
  return newScheme;
}

export async function updateFdMisScheme(schemeId, schemeData) {
  const list = mockDb.getFdMisSchemes();
  const updated = list.map((s) => (String(s.id) === String(schemeId) ? { ...s, ...schemeData } : s));
  mockDb.saveFdMisSchemes(updated);
  return updated.find((s) => String(s.id) === String(schemeId));
}

export async function deleteFdMisScheme(schemeId) {
  const list = mockDb.getFdMisSchemes();
  mockDb.saveFdMisSchemes(list.filter((s) => String(s.id) !== String(schemeId)));
  return { success: true };
}

export async function changeFdMisSchemeStatus(schemeId, isActive) {
  return updateFdMisScheme(schemeId, { is_active: Boolean(isActive) });
}

export async function getBranchAdminFdMisSchemes() {
  return mockDb.getFdMisSchemes();
}

export async function getMemberFdMisSchemes() {
  return mockDb.getFdMisSchemes().filter((s) => s.is_active !== false);
}

const fdMisSchemeService = {
  getFdMisSchemes,
  getFdMisScheme,
  createFdMisScheme,
  updateFdMisScheme,
  deleteFdMisScheme,
  changeFdMisSchemeStatus,
  getBranchAdminFdMisSchemes,
  getMemberFdMisSchemes,
};

export default fdMisSchemeService;
