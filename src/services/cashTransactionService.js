// Cash Transaction Service - Demo Mode (Offline Mock)

export async function lookupSavingsAccount(accountNo) {
  return {
    account_number: accountNo || 'KN-01-SB-183188',
    member_name: 'Manu Sharma',
    balance: 45000,
    status: 'active',
  };
}

export async function createCashDeposit(data) {
  return { success: true, transaction_id: `TXN-${Date.now()}`, ...data };
}

export async function createCashWithdrawal(data) {
  return { success: true, transaction_id: `TXN-${Date.now()}`, ...data };
}

export async function getStaffCashTransactions() { return []; }
export async function getBranchAdminCashTransactions() { return []; }
export async function getSuperAdminCashTransactions() { return []; }
export async function getMemberSavingsAccountTransactions() { return []; }
export async function getBranchAdminMemberCashTransactions() { return []; }
export async function getSuperAdminMemberCashTransactions() { return []; }

export async function getAccountantMemberCashTransactions(memberId, params = {}) {
  return {
    transactions: [],
    total: 0,
    page: 1,
    limit: 10,
  };
}

