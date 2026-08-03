import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

export const useAdminEmailSettings = () =>
  useQuery({
    queryKey: ['admin-email-settings'],
    queryFn: () => api.get('/admin/email-settings').then((res) => res.data.data),
    staleTime: 1000 * 30,
  });

export const useCreateEmailSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => api.post('/admin/email-settings', payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-settings'] });
      toast.success('SMTP setting created');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Request failed');
    },
  });
};

export const useUpdateEmailSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/email-settings/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-settings'] });
      toast.success('SMTP setting updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });
};

export const useSendTestEmail = () =>
  useMutation({
    mutationFn: (payload) => api.post('/admin/email-settings/test', payload).then((res) => res.data),
    onSuccess: (data) => {
      toast.success(data?.message || 'Test email sent');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Test email failed');
    },
  });
