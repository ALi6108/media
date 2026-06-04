import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// We'll create the authStore soon. It will contain the token.

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://lmediaback-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // We will retrieve the token from local storage or the authStore
    // Zustand persist stores its state in localStorage by default.
    // However, it's safer to just read it from localStorage directly or the store's getState()
    const state = useAuthStore.getState();
    const token = state.accessToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Unwrap response envelope: { success, data, message, meta } -> response.data = data
    if (response.data && typeof response.data === 'object' && response.data.success === true && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const state = useAuthStore.getState();
        const refreshToken = state.refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Attempt to refresh the token
        const response = await axios.post(`${api.defaults.baseURL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const resData = response.data?.data || response.data;
        const newAccessToken = resData.access_token || resData.accessToken;
        const newRefreshToken = resData.refresh_token || resData.refreshToken || refreshToken;
        
        // Update store with new token (pakai refresh_token BARU dari response)
        state.setTokens(newAccessToken, newRefreshToken);
        
        // Update header for current request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out. AuthProvider will handle redirect to /login.
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    if (error.response?.status === 403) {
      const msg = error.response?.data?.message || 'Akses ditolak. Anda tidak memiliki izin.';
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export default api;
