import api from './api';

export const getSales = async (params = {}) => {
  const cleanParams = {};
  if (params.search) cleanParams.search = params.search;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get('/api/sales/', { params: cleanParams });
  return response.data;
};

export const getSale = async (id) => {
  const response = await api.get(`/api/sales/${id}/`);
  return response.data;
};
