import api from './client';
import { isFirebaseMode } from '../config/firebase';
import { firebaseLeaveService } from '../services/firebaseLeaves';

export const leaveApi = {
  getMyBalances: async () => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.getMyBalances();
    }
    const response = await api.get('/leaves/balances/my_balances/');
    return response.data;
  },

  getAllBalances: async (params = {}) => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.getAllBalances(params);
    }
    const response = await api.get('/leaves/balances/', { params });
    return response.data;
  },

  getMyRequests: async () => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.getMyRequests();
    }
    const response = await api.get('/leaves/requests/my_requests/');
    return response.data;
  },

  getPendingRequests: async () => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.getPendingRequests();
    }
    const response = await api.get('/leaves/requests/pending/');
    return response.data;
  },

  getAllRequests: async (params = {}) => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.getAllRequests(params);
    }
    const response = await api.get('/leaves/requests/', { params });
    return response.data;
  },

  applyLeave: async (data) => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.applyLeave(data);
    }
    const response = await api.post('/leaves/requests/', data);
    return response.data;
  },

  approveLeave: async (id, review_comments = '') => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.approveLeave(id, review_comments);
    }
    const response = await api.post(`/leaves/requests/${id}/approve/`, { review_comments });
    return response.data;
  },

  rejectLeave: async (id, review_comments = '') => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.rejectLeave(id, review_comments);
    }
    const response = await api.post(`/leaves/requests/${id}/reject/`, { review_comments });
    return response.data;
  },

  cancelLeave: async (id) => {
    if (isFirebaseMode()) {
      return firebaseLeaveService.cancelLeave(id);
    }
    const response = await api.post(`/leaves/requests/${id}/cancel/`);
    return response.data;
  }
};
