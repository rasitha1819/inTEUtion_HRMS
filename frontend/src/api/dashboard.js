import api from './client';
import { isFirebaseMode } from '../config/firebase';
import { firebaseDashboardService } from '../services/firebaseDashboard';

export const dashboardApi = {
  getMetrics: async () => {
    if (isFirebaseMode()) {
      return firebaseDashboardService.getMetrics();
    }
    const response = await api.get('/dashboard/metrics/');
    return response.data;
  }
};
