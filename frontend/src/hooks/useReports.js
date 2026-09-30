import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const defaultReportRange = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0],
};

export const useSalesOverview = (range = defaultReportRange) =>
  useQuery({
    queryKey: ['reports-overview', range],
    queryFn: () => api.get('/admin/reports/overview', { params: range }).then((res) => res.data.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

export const useDailyRevenue = (range = defaultReportRange) =>
  useQuery({
    queryKey: ['reports-daily', range],
    queryFn: () => api.get('/admin/reports/daily', { params: range }).then((res) => res.data.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

export const useCategoryRevenue = (range = defaultReportRange) =>
  useQuery({
    queryKey: ['reports-category', range],
    queryFn: () => api.get('/admin/reports/by-category', { params: range }).then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
  });

export const usePaymentStats = (range = defaultReportRange) =>
  useQuery({
    queryKey: ['reports-payments', range],
    queryFn: () => api.get('/admin/reports/payments', { params: range }).then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
  });

export const downloadCSV = async (range) => {
  const response = await api.get('/admin/reports/export', {
    params: range,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `homa-orders-${range.from}-to-${range.to}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
