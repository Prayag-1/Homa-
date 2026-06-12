import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

export const usePublicBrands = () =>
  useQuery({
    queryKey: ['brands', 'public'],
    queryFn: () => api.get('/brands').then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

export const usePublicCategories = () =>
  useQuery({
    queryKey: ['categories', 'public'],
    queryFn: () => api.get('/categories').then((res) => res.data.data),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

export const useAdminBrands = (filters = {}) =>
  useQuery({
    queryKey: ['admin-brands', filters],
    queryFn: () => api.get('/brands/admin', { params: filters }).then((res) => res.data.data),
    staleTime: 1000 * 30,
  });

export const useAdminCategories = (filters = {}) =>
  useQuery({
    queryKey: ['admin-categories', filters],
    queryFn: () => api.get('/categories/admin', { params: filters }).then((res) => res.data.data),
    staleTime: 1000 * 30,
  });

const makeMutations = (entity, queryKey, publicQueryKey, path) => ({
  useCreate: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data) => api.post(path, data).then((res) => res.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        queryClient.invalidateQueries({ queryKey: [publicQueryKey] });
        toast.success(`${entity} created`);
      },
      onError: (err) => toast.error(err.response?.data?.message || `Failed to create ${entity}`),
    });
  },
  useUpdate: (id) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data) => api.put(`${path}/${id}`, data).then((res) => res.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        queryClient.invalidateQueries({ queryKey: [publicQueryKey] });
        toast.success(`${entity} updated`);
      },
      onError: (err) => toast.error(err.response?.data?.message || `Failed to update ${entity}`),
    });
  },
  useToggle: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id) => api.patch(`${path}/${id}/toggle`).then((res) => res.data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        queryClient.invalidateQueries({ queryKey: [publicQueryKey] });
        toast.success(data.message);
      },
      onError: () => toast.error('Failed to update status'),
    });
  },
  useDelete: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id) => api.delete(`${path}/${id}`).then((res) => res.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        queryClient.invalidateQueries({ queryKey: [publicQueryKey] });
        toast.success(`${entity} deleted`);
      },
      onError: (err) => toast.error(err.response?.data?.message || `Failed to delete ${entity}`),
    });
  },
});

export const brandMutations = makeMutations('Brand', 'admin-brands', 'brands', '/brands/admin');
export const categoryMutations = makeMutations('Category', 'admin-categories', 'categories', '/categories/admin');
