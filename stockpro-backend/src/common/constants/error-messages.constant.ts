/**
 * Centralized Error Messages
 * All error message keys and their corresponding values
 */
export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  LOGOUT_FAILED: 'Failed to logout. Please try again',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  SESSION_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_REFRESH_FAILED: 'Failed to refresh token. Please try again',

  // Password Recovery Errors
  OTP_SENT_IF_EMAIL_EXISTS: 'OTP sent if email exists',
  OTP_SENT_SUCCESS: 'OTP sent successfully to your email',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  OTP_VERIFIED_SUCCESS: 'OTP verified successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  OTP_SEND_FAILED: 'Failed to send OTP. Please try again',
  PASSWORD_RESET_FAILED: 'Failed to reset password. Please try again',
  OTP_NOT_VERIFIED: 'Please verify OTP before resetting password',

  // User Errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_BLOCKED: 'Your account has been blocked. Please contact support',
  CANNOT_DEACTIVATE_OWN_ACCOUNT: 'You cannot deactivate your own account',
  EMAIL_CHECK_FAILED: 'Failed to verify email. Please try again',

  // Session Errors
  SESSION_CREATE_FAILED: 'Failed to create session. Please try again',
  SESSION_DELETE_FAILED: 'Failed to delete session. Please try again',
  SESSION_RETRIEVE_FAILED: 'Failed to retrieve sessions. Please try again',
  SESSION_COUNT_FAILED: 'Failed to count sessions. Please try again',
  SESSION_NOT_FOUND:
    'Session not found or you do not have permission to access it',
  SESSION_TERMINATE_FAILED: 'Failed to terminate session. Please try again',
  SESSION_TERMINATE_ALL_FAILED:
    'Failed to terminate all sessions. Please try again',

  // Validation Messages (DTOs)
  EMAIL_REQUIRED: 'Email is required',
  INVALID_EMAIL: 'Email address is invalid',
  EMAIL_SHOULD_BE_STRING: 'Email must be a string',

  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_SHOULD_BE_STRING: 'Password must be a string',
  PASSWORD_MIN_LENGTH_8_MAX_25: 'Password must be between 8 and 25 characters',
  PASSWORD_MIN_LENGTH_8: 'Password must be at least 8 characters',

  NAME_REQUIRED: 'Name is required',
  NAME_SHOULD_BE_STRING: 'Name must be a string',
  NAME_MAX_LENGTH_25: 'Name must be at most 25 characters',
  NAME_MIN_LENGTH_3: 'Name must be at least 3 characters',
  NAME_MAX_LENGTH_100: 'Name must be at most 100 characters',

  IMAGE_SHOULD_BE_STRING: 'Image must be a string',
  IMAGE_MAX_LENGTH_255: 'Image must be at most 255 characters',
  IMAGE_MAX_LENGTH_500: 'Image must be at most 500 characters',

  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH_6: 'Username must be at least 6 characters',
  USERNAME_SHOULD_BE_STRING: 'Username must be a string',

  USER_ID_REQUIRED: 'User ID is required',
  USER_ID_SHOULD_BE_STRING: 'User ID must be a string',
  USER_ID_SHOULD_BE_STRING_FILTER: 'User ID must be a string',

  ACTIVE_STATUS_SHOULD_BE_BOOLEAN: 'Active status must be a boolean',
  ACTIVE_STATUS_REQUIRED: 'Active status is required',

  // OTP Validation Messages
  OTP_REQUIRED: 'OTP is required',
  OTP_SHOULD_BE_STRING: 'OTP must be a string',
  OTP_MUST_BE_6_DIGITS: 'OTP must be exactly 6 digits',

  // Password Update Messages
  OLD_PASSWORD_REQUIRED: 'Old password is required',
  OLD_PASSWORD_SHOULD_BE_STRING: 'Old password must be a string',
  OLD_PASSWORD_INCORRECT: 'Old password is incorrect',
  PASSWORD_UPDATE_SUCCESS: 'Password updated successfully',
  PASSWORD_UPDATE_FAILED: 'Failed to update password. Please try again',
  NEW_PASSWORD_SAME_AS_OLD: 'New password must be different from old password',

  // Email Verification Messages
  EMAIL_VERIFICATION_SUCCESS: 'Email verified successfully',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  SIGNUP_SUCCESS:
    'Signup successful. Please check your email to verify your account.',

  // Session Messages
  ALREADY_SIGNED_IN: 'You are already signed in with this device',

  // Resend Verification Messages
  VERIFICATION_CODE_RESENT: 'Verification code has been resent to your email',
  FORGOT_PASSWORD_CODE_RESENT:
    'Password reset code has been resent to your email',
} as const;

// Type for error message keys
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
