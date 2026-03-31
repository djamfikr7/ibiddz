import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ibiddz_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('ibiddz_refresh_token');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/v1/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('ibiddz_token', data.accessToken);
          localStorage.setItem('ibiddz_refresh_token', data.refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('ibiddz_token');
        localStorage.removeItem('ibiddz_refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  sendOtp: (phone: string, deviceFingerprint?: string) =>
    api.post('/v1/auth/otp', { phone }, {
      headers: deviceFingerprint ? { 'x-device-fingerprint': deviceFingerprint } : {},
    }),
  verifyOtp: (phone: string, code: string, deviceFingerprint?: string) =>
    api.post('/v1/auth/verify', { phone, code }, {
      headers: deviceFingerprint ? { 'x-device-fingerprint': deviceFingerprint } : {},
    }),
  getMe: () => api.get('/v1/auth/me'),
  logout: (refreshToken?: string) =>
    api.post('/v1/auth/logout', refreshToken ? { refreshToken } : {}),
};

export const listingsApi = {
  getAll: (params?: Record<string, any>) => api.get('/v1/listings', { params }),
  getById: (id: string) => api.get(`/v1/listings/${id}`),
  create: (data: any) => api.post('/v1/listings', data),
  update: (id: string, data: any) => api.put(`/v1/listings/${id}`, data),
  delete: (id: string) => api.delete(`/v1/listings/${id}`),
  getFeatured: () => api.get('/v1/listings?featured=true&status=ACTIVE'),
  getUserListings: () => api.get('/v1/listings?my=true'),
};

export const auctionsApi = {
  getLive: () => api.get('/v1/auctions?status=LIVE'),
  getUpcoming: () => api.get('/v1/auctions?status=UPCOMING'),
  getById: (id: string) => api.get(`/v1/auctions/${id}`),
  placeBid: (listingId: string, amount: number) =>
    api.post('/v1/bids', { listingId, amount }),
  setProxyBid: (listingId: string, maxAmount: number) =>
    api.post('/v1/bids/proxy', { listingId, maxAmount }),
  getBidHistory: (listingId: string) => api.get(`/v1/listings/${listingId}/bids`),
};

export const ordersApi = {
  create: (data: any) => api.post('/v1/orders', data),
  getById: (id: string) => api.get(`/v1/orders/${id}`),
  getUserOrders: () => api.get('/v1/orders?my=true'),
  confirmDelivery: (orderId: string, codToken: string) =>
    api.post(`/v1/cod/confirm`, { orderId, codToken }),
};

export const userApi = {
  getTrustScore: () => api.get('/v1/user/trust'),
  getWallet: () => api.get('/v1/user/wallet'),
  requestPayout: (data: any) => api.post('/v1/payouts', data),
  getNotifications: () => api.get('/v1/notifications'),
  markNotificationRead: (id: string) => api.put(`/v1/notifications/${id}/read`),
};
