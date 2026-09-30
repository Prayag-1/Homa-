import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

export const usePublicSettings = () =>
  useQuery({
    queryKey: ['site-settings-public'],
    queryFn: () => api.get('/settings/public').then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 10,
  });

export const useAdminSettings = () =>
  useQuery({
    queryKey: ['site-settings-admin'],
    queryFn: () => api.get('/settings/admin').then((res) => res.data.data),
    staleTime: 1000 * 60,
  });

const makeSettingsMutation = (endpoint, successMessage) => () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.patch(endpoint, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success(successMessage);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useUpdateWhatsApp = makeSettingsMutation('/settings/admin/whatsapp', 'WhatsApp settings saved');
export const useUpdateFooter = makeSettingsMutation('/settings/admin/footer', 'Footer saved');

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      const formData = new FormData();

      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'qrImageFile') {
          if (value instanceof File) formData.append('paymentQrImageFile', value);
          return;
        }

        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
          return;
        }

        formData.append(key, String(value));
      });

      return api.patch('/settings/admin/payment', formData).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success('Payment settings saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      const formData = new FormData();

      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'imageFile') {
          if (value instanceof File) formData.append('announcementImageFile', value);
          return;
        }

        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
          return;
        }

        formData.append(key, String(value));
      });

      return api.patch('/settings/admin/announcement', formData).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast.success('Announcement bar saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
};
