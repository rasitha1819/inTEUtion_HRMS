import api from './client';
import { isFirebaseMode } from '../config/firebase';
import { firebaseAuthService } from '../services/firebaseAuth';

export const authApi = {
  login: async (email, password) => {
    if (isFirebaseMode()) {
      return firebaseAuthService.login(email, password);
    }
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    if (isFirebaseMode()) {
      return firebaseAuthService.getCurrentUser();
    }
    const response = await api.get('/auth/me/');
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    if (isFirebaseMode()) {
      return firebaseAuthService.changePassword(oldPassword, newPassword);
    }
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  getUsersList: async (params = {}) => {
    if (isFirebaseMode()) {
      return firebaseAuthService.getUsersList(params);
    }
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },

  logout: async () => {
    if (isFirebaseMode()) {
      return firebaseAuthService.logout();
    }
  }
};
