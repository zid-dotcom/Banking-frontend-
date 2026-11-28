// Cash Reconciliation Service - Demo Mode (Offline Mock)

export async function getStaffCashDays() { return []; }
export async function openStaffCashDay() { return { success: true }; }
export async function closeStaffCashDay() { return { success: true }; }
export async function getCurrentCashDayStatus() { return { is_open: true, opening_cash: 50000 }; }
export async function listAccountantCashReconciliations() { return []; }
export async function getAccountantCashReconciliation() { return null; }
export async function reviewAccountantCashReconciliation() { return { success: true }; }
export async function getBranchDailyCashReport() { return { total_inflow: 250000, total_outflow: 180000 }; }
export async function getBranchRangeCashReport() { return { total_inflow: 2500000, total_outflow: 1800000 }; }
export async function getBranchAdminCashReconciliation() { return []; }
export async function decideBranchAdminCashReconciliation() { return { success: true }; }
export async function getSuperAdminDailyCashReports() { return []; }
export async function getSuperAdminRangeCashReports() { return []; }
export async function getSuperAdminCashReconciliation() { return []; }
export async function decideSuperAdminCashReconciliation() { return { success: true }; }
