// Membership Settings Service - Demo Mode (Offline Mock)

const demoSettings = {
  id: 1,
  branch_id: 1,
  branch_name: 'Kozhikode North Agro Hub',
  membership_fee: 500,
  fee_amount: 500,
  upi_id: 'aurumfx.agro@upi',
  qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=aurumfx.agro@upi&pn=AurumFX%20Cooperative',
  qr_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=aurumfx.agro@upi&pn=AurumFX%20Cooperative',
  is_active: true,
};

export function resolveBranchQrImageUrl(url) {
  return url || demoSettings.qr_image_url;
}

export async function getBranchAdminMembershipSettings() {
  return demoSettings;
}

export async function createBranchAdminMembershipSettings(data) {
  return { ...demoSettings, ...data };
}

export async function updateBranchAdminMembershipSettings(data) {
  return { ...demoSettings, ...data };
}

export async function getMemberRegistrationSettings() {
  return demoSettings;
}

export async function getMemberRegistrationQrCode() {
  return {
    qr_code_url: demoSettings.qr_code_url,
    upi_id: demoSettings.upi_id,
    amount: demoSettings.membership_fee,
  };
}

export async function lookupMemberStaffCode(code) {
  return {
    staff_code: code || 'STF-001',
    name: 'Rahul Nair',
    full_name: 'Rahul Nair',
    role: 'Cashier & Teller',
    branch_name: 'Kozhikode North Agro Hub',
  };
}

export async function getBranchAdminMemberRegistrationApplications() {
  return [
    {
      id: 101,
      full_name: 'Kavitha R',
      name: 'Kavitha R',
      phone: '9847099887',
      email: 'kavitha@aurumfx.com',
      fee_paid: 500,
      payment_reference: 'UPI-REF-998811',
      status: 'pending',
      created_at: '2026-11-26T10:00:00Z',
    },
  ];
}

export async function getBranchAdminMemberRegistrationApplication(id) {
  const list = await getBranchAdminMemberRegistrationApplications();
  return list.find((a) => String(a.id) === String(id)) || list[0];
}

export async function getBranchAdminMemberRegistrationDocument() {
  return { url: 'https://via.placeholder.com/600x400.png?text=Registration+Payment+Screenshot' };
}

export async function decideBranchAdminMemberRegistrationApplication(id, decision) {
  return { success: true, message: `Application ${decision} successfully in demo mode.` };
}
