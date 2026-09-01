import api from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  getUsersList: async (params = {}) => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  }
};
