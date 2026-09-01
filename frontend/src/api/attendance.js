import api from './client';

export const attendanceApi = {
  getTodayStatus: async () => {
    const response = await api.get('/attendance/today/');
    return response.data;
  },

  checkIn: async (notes = '') => {
    const response = await api.post('/attendance/check_in/', { notes });
    return response.data;
  },

  checkOut: async (notes = '') => {
    const response = await api.post('/attendance/check_out/', { notes });
    return response.data;
  },

  getAttendanceLogs: async (params = {}) => {
    const response = await api.get('/attendance/', { params });
    return response.data;
  },

  getAttendanceSummary: async (params = {}) => {
    const response = await api.get('/attendance/summary/', { params });
    return response.data;
  }
};
