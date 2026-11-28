// Product Account Service - Demo Mode (Offline Mock)

export async function createProductAccountRequest(data) {
  return { success: true, message: 'Request submitted successfully in demo mode.', data };
}

export async function getMemberProductAccountRequests() { return []; }
export async function getMemberProductAccountRequest() { return null; }
export async function getMemberProductAccounts() { return []; }
export async function getBranchAdminProductAccountRequests() { return []; }
export async function getBranchAdminProductAccountRequest() { return null; }
export async function decideBranchAdminProductAccountRequest() { return { success: true }; }
export async function getBranchAdminInvestmentAccounts() { return []; }
export async function getBranchAdminFdMisAccounts() { return []; }
export async function getAccountantInvestmentAccounts() { return []; }
export async function getAccountantFdMisAccounts() { return []; }
export async function getSuperAdminBranchInvestmentAccounts() { return []; }
export async function getSuperAdminBranchFdMisAccounts() { return []; }
