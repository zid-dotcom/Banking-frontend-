// Auth Service - Demo Mode (Offline Mock)

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export async function changePassword({ old_password, new_password, confirm_password }) {
  // Simulate successful password update
  return {
    success: true,
    message: 'Password updated successfully in demo mode.',
  };
}

export async function memberForgotPassword(member_code) {
  return {
    success: true,
    message: `Demo OTP: 123456 sent to registered contact for member ${member_code}.`,
  };
}

export async function memberResetPassword({ member_code, otp, new_password, confirm_password }) {
  return {
    success: true,
    message: 'Member password reset successfully in demo mode.',
  };
}

export async function superAdminForgotPassword(email) {
  return {
    success: true,
    message: `Demo OTP: 654321 sent to administrator email ${email}.`,
  };
}

export async function superAdminResetPassword({ email, otp, new_password, confirm_password }) {
  return {
    success: true,
    message: 'Super Admin password reset successfully in demo mode.',
  };
}
