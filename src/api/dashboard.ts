import api from './api';
import type { DashboardData, StatisticsData } from '../types';

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get<DashboardData>('/api/dashboard/');
  return response.data;
};

export const getStatistics = async (): Promise<StatisticsData> => {
  const response = await api.get<StatisticsData>('/api/statistics/');
  return response.data;
};
