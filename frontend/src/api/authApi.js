import api from './axiosConfig';

export const authApi = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
};

export default authApi;
