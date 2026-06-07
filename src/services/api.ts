import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Creating a production-grade, highly-configurable Axios client
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token securely
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('akpbf_erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Inject custom headers for protection (XSS, CSRF checks if applicable)
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Automatic Retry with Exponential Backoff
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const MAX_RETRIES = 3;

// Response Interceptor: Global Error handling and Automatic Refresh Token / Retry
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as RetryConfig;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Initialize retry count
    originalRequest._retryCount = originalRequest._retryCount || 0;

    // 1. Automatic Refresh Token logic if receiving 401
    if (error.response?.status === 401 && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount += 1;
      
      try {
        // Attempt token rotation / refresh
        const refreshToken = localStorage.getItem('akpbf_erp_refresh_token');
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { token, newRefreshToken } = res.data;
          
          if (token) {
            localStorage.setItem('akpbf_erp_token', token);
            if (newRefreshToken) {
              localStorage.setItem('akpbf_erp_refresh_token', newRefreshToken);
            }
            
            // Re-execute old request with active Bearer
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        console.error('Session expired. Automatic Refresh Token rotated failure:', refreshErr);
        // Clear tokens and redirect to sign-in or alert state
        localStorage.removeItem('akpbf_erp_token');
        localStorage.removeItem('akpbf_erp_refresh_token');
        localStorage.removeItem('akpbf_user_role');
      }
    }

    // 2. Network/Transient Error Retry mechanism (e.g., status 503/504, or network timeout)
    const isTransientError = !error.response || [502, 503, 504].includes(error.response.status);
    if (isTransientError && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount += 1;
      const backoffDelay = Math.pow(2, originalRequest._retryCount) * 1000;
      
      console.warn(`Transient error detected [${error.message}]. Retrying in ${backoffDelay}ms (Attempt ${originalRequest._retryCount}/${MAX_RETRIES})...`);
      
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      return api(originalRequest);
    }

    // 3. Centralized global business error formatting
    let customErrorMsg = 'Une erreur imprévue est survenue avec le serveur AKPBF de Ouagadougou.';
    if (error.response?.data?.error) {
      customErrorMsg = error.response.data.error;
    } else if (error.message) {
      customErrorMsg = error.message;
    }

    const businessError = {
      message: customErrorMsg,
      status: error.response?.status || 500,
      originalError: error,
    };

    return Promise.reject(businessError);
  }
);

export default api;
