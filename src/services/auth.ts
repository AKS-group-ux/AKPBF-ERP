import api from './api';

export const AuthService = {
  /**
   * Log into the enterprise portal or citizen portal securely
   */
  async login(payload: any) {
    try {
      const response = await api.post('/auth/login', payload);
      if (response.data.token) {
        localStorage.setItem('akpbf_erp_token', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('akpbf_erp_refresh_token', response.data.refreshToken);
        }
        localStorage.setItem('akpbf_user_role', response.data.user?.role || 'CLIENT');
      }
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fetch active logged identity
   */
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Request session revocation
   */
  async logout() {
    try {
      localStorage.removeItem('akpbf_erp_token');
      localStorage.removeItem('akpbf_erp_refresh_token');
      localStorage.removeItem('akpbf_user_role');
      sessionStorage.clear();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  },

  /**
   * Initiate Forgot Password query
   */
  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Submit complete Reset Password form
   */
  async resetPassword(token: string, passwordText: string) {
    const response = await api.post('/auth/reset-password', { token, passwordText });
    return response.data;
  }
};
