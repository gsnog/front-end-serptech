import api from '@/lib/api';

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
  confirm_password: string;
}

export const authService = {
  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<{ detail: string }>('/api/forgot-password/', payload),

  verifyCode: (payload: VerifyCodePayload) =>
    api.post<{ detail: string }>('/api/verify-reset-code/', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<{ detail: string }>('/api/reset-password/', payload),
};
