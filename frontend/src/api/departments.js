import api from './client';
import { isFirebaseMode } from '../config/firebase';
import { firebaseDepartmentService } from '../services/firebaseDepartments';

export const departmentApi = {
  getDepartments: async () => {
    if (isFirebaseMode()) {
      return firebaseDepartmentService.getDepartments();
    }
    const response = await api.get('/departments/');
    return response.data;
  },

  getDepartment: async (id) => {
    if (isFirebaseMode()) {
      return firebaseDepartmentService.getDepartment(id);
    }
    const response = await api.get(`/departments/${id}/`);
    return response.data;
  },

  createDepartment: async (data) => {
    if (isFirebaseMode()) {
      return firebaseDepartmentService.createDepartment(data);
    }
    const response = await api.post('/departments/', data);
    return response.data;
  },

  updateDepartment: async (id, data) => {
    if (isFirebaseMode()) {
      return firebaseDepartmentService.updateDepartment(id, data);
    }
    const response = await api.put(`/departments/${id}/`, data);
    return response.data;
  },

  deleteDepartment: async (id) => {
    if (isFirebaseMode()) {
      return firebaseDepartmentService.deleteDepartment(id);
    }
    const response = await api.delete(`/departments/${id}/`);
    return response.data;
  }
};
