import api from './client';
import { isFirebaseMode } from '../config/firebase';
import { firebaseEmployeeService } from '../services/firebaseEmployees';

export const employeeApi = {
  getEmployees: async (params = {}) => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.getEmployees(params);
    }
    const response = await api.get('/employees/', { params });
    return response.data;
  },

  getEmployee: async (id) => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.getEmployee(id);
    }
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },

  getMyProfile: async () => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.getMyProfile();
    }
    const response = await api.get('/employees/me/');
    return response.data;
  },

  createEmployee: async (data) => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.createEmployee(data);
    }
    const response = await api.post('/employees/', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.updateEmployee(id, data);
    }
    const response = await api.patch(`/employees/${id}/`, data);
    return response.data;
  },

  deactivateEmployee: async (id) => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.deactivateEmployee(id);
    }
    const response = await api.post(`/employees/${id}/deactivate/`);
    return response.data;
  },

  reactivateEmployee: async (id) => {
    if (isFirebaseMode()) {
      return firebaseEmployeeService.reactivateEmployee(id);
    }
    const response = await api.post(`/employees/${id}/reactivate/`);
    return response.data;
  }
};
