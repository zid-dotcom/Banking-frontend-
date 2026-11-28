// Nominee Service - Demo Mode (Offline Mock)

const demoNominee = {
  id: 1,
  nominee_name: 'Ananya Sharma',
  relation: 'Spouse',
  relationship: 'Spouse',
  dob: '1990-08-20',
  phone: '9876543219',
  email: 'ananya@aurumfx.com',
  address: 'Plot 44, Agro Green Valley, Kozhikode',
  allocation_percentage: 100,
  allocation: 100,
  status: 'approved',
  id_proof_type: 'Aadhaar Card',
};

export async function getMemberNominee() {
  return demoNominee;
}

export async function getMemberNomineeDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Nominee+Verified+Document' };
}

export async function downloadMemberNomineeDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Nominee+Downloadable+Doc' };
}

export async function submitMemberNominee(data) {
  return { success: true, message: 'Nominee details updated successfully in demo mode.', data };
}

export async function createMemberNomineeChangeRequest(data) {
  return { success: true, message: 'Nominee change request submitted for branch verification.', data };
}

export async function getMemberNomineeChangeRequests() {
  return [];
}

export async function getMemberNomineeChangeRequest() {
  return null;
}

export async function getBranchAdminNomineeChangeRequests() {
  return [];
}

export async function getBranchAdminNomineeChangeRequest() {
  return null;
}

export async function reviewBranchAdminNomineeChangeRequest() {
  return { success: true };
}
