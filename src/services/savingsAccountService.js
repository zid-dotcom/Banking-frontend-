// Savings Account Service - Demo Mode (Offline Mock)

export async function createMemberSavingsAccountRequest(data) {
  return { success: true, message: 'Savings account application created in demo mode.', data };
}

export async function getMemberSavingsAccountRequests() { return []; }
export async function getMemberSavingsAccounts() {
  return [
    {
      id: 1,
      account_number: 'KN-01-SB-183188',
      scheme_name: 'Regular Member Savings Deposit',
      scheme_code: 'SCH01254',
      balance: 45000,
      current_balance: 45000,
      annual_interest_rate: 4.5,
      branch_name: 'Kozhikode North Agro Hub',
      ifsc_code: 'ARUM0001',
      status: 'active',
      opened_at: '2025-01-15T10:00:00Z',
    },
  ];
}
export async function getBranchAdminSavingsAccountRequests() { return []; }
export async function decideBranchSavingsAccountRequest() { return { success: true }; }
export async function getBranchAdminSavingsAccounts() { return []; }
export async function getBranchAdminSavingsAccount() { return null; }
export async function getSuperAdminSavingsAccounts() { return []; }
export async function getSuperAdminSavingsAccount() { return null; }
