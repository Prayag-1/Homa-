import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

export const usePublicBanners = () =>
  useQuery({
    queryKey: ['hero-banners-public'],
    queryFn: () => api.get('/banners/public').then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

export const useAdminBanners = () =>
  useQuery({
    queryKey: ['hero-banners-admin'],
    queryFn: () => api.get('/banners/admin').then((res) => res.data.data),
    staleTime: 1000 * 30,
  });

const toFormData = (data = {}) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'imageFile') {
      if (value instanceof File) formData.append('bannerImageFile', value);
      return;
    }
    formData.append(key, String(value));
  });

  return formData;
};

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
  queryClient.invalidateQueries({ queryKey: ['hero-banners-public'] });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/banners/admin', toFormData(data)).then((res) => res.data),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Banner created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) =>
      api.put(`/banners/admin/${id}`, toFormData(data)).then((res) => res.data),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Banner updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/banners/admin/${id}`).then((res) => res.data),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Banner deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });
};
