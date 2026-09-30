import api from './api';

export const getDashboard = async () => {
  const response = await api.get('/api/dashboard/');
  return response.data;
};

export const getStatistics = async () => {
  const response = await api.get('/api/statistics/');
  return response.data;
};
