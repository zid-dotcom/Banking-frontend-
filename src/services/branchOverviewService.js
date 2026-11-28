// Branch Overview Service - Demo Mode (Offline Mock)

export async function getBranchAdminOverview() {
  return {
    total_members: 420,
    active_schemes: 12,
    total_deposits: 18500000,
    total_loans_disbursed: 14200000,
    monthly_collection: 2450000,
  };
}

export async function getSuperAdminBranchOverview() {
  return {
    total_branches: 4,
    total_members: 1585,
    total_society_funds: 74500000,
    total_active_loans: 48900000,
  };
}
