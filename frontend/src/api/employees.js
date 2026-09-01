import api from './client';

export const employeeApi = {
  getEmployees: async (params = {}) => {
    const response = await api.get('/employees/', { params });
    return response.data;
  },

  getEmployee: async (id) => {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get('/employees/me/');
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await api.post('/employees/', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.patch(`/employees/${id}/`, data);
    return response.data;
  },

  deactivateEmployee: async (id) => {
    const response = await api.post(`/employees/${id}/deactivate/`);
    return response.data;
  },

  reactivateEmployee: async (id) => {
    const response = await api.post(`/employees/${id}/reactivate/`);
    return response.data;
  }
};
