import api from './client';

export const leaveApi = {
  getMyBalances: async () => {
    const response = await api.get('/leaves/balances/my_balances/');
    return response.data;
  },

  getAllBalances: async (params = {}) => {
    const response = await api.get('/leaves/balances/', { params });
    return response.data;
  },

  getMyRequests: async () => {
    const response = await api.get('/leaves/requests/my_requests/');
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await api.get('/leaves/requests/pending/');
    return response.data;
  },

  getAllRequests: async (params = {}) => {
    const response = await api.get('/leaves/requests/', { params });
    return response.data;
  },

  applyLeave: async (data) => {
    const response = await api.post('/leaves/requests/', data);
    return response.data;
  },

  approveLeave: async (id, review_comments = '') => {
    const response = await api.post(`/leaves/requests/${id}/approve/`, { review_comments });
    return response.data;
  },

  rejectLeave: async (id, review_comments = '') => {
    const response = await api.post(`/leaves/requests/${id}/reject/`, { review_comments });
    return response.data;
  },

  cancelLeave: async (id) => {
    const response = await api.post(`/leaves/requests/${id}/cancel/`);
    return response.data;
  }
};
