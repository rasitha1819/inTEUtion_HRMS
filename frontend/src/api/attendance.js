import api from './client';
import { isFirebaseMode } from '../config/firebase';
import { firebaseAttendanceService } from '../services/firebaseAttendance';

export const attendanceApi = {
  getTodayStatus: async () => {
    if (isFirebaseMode()) {
      return firebaseAttendanceService.getTodayStatus();
    }
    const response = await api.get('/attendance/today/');
    return response.data;
  },

  checkIn: async (notes = '') => {
    if (isFirebaseMode()) {
      return firebaseAttendanceService.checkIn(notes);
    }
    const response = await api.post('/attendance/check_in/', { notes });
    return response.data;
  },

  checkOut: async (notes = '') => {
    if (isFirebaseMode()) {
      return firebaseAttendanceService.checkOut(notes);
    }
    const response = await api.post('/attendance/check_out/', { notes });
    return response.data;
  },

  getAttendanceLogs: async (params = {}) => {
    if (isFirebaseMode()) {
      return firebaseAttendanceService.getAttendanceLogs(params);
    }
    const response = await api.get('/attendance/', { params });
    return response.data;
  },

  getAttendanceSummary: async (params = {}) => {
    if (isFirebaseMode()) {
      return firebaseAttendanceService.getAttendanceSummary(params);
    }
    const response = await api.get('/attendance/summary/', { params });
    return response.data;
  }
};
