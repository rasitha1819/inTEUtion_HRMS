import api from './client';

export const dashboardApi = {
  getMetrics: async () => {
    const response = await api.get('/dashboard/metrics/');
    return response.data;
  }
};
