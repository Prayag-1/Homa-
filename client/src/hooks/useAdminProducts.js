import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

export const useAdminProducts = (filters) =>
  useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => api.get('/admin/products', { params: filters }).then((res) => res.data.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

export const useAdminProduct = (id) =>
  useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/admin/products/${id}`).then((res) => res.data.data),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) =>
      api.post('/admin/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create product');
    },
  });
};

export const useUpdateProduct = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) =>
      api.put(`/admin/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update product');
    },
  });
};

export const useToggleActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.patch(`/admin/products/${id}/toggle-active`).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(data.message);
    },
    onError: () => toast.error('Failed to update product status'),
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }) =>
      api.patch(`/admin/products/${id}/stock`, { stock }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Stock updated');
    },
    onError: () => toast.error('Failed to update stock'),
  });
};

export const useToggleFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, field }) =>
      api.patch(`/admin/products/${id}/featured`, { field }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => toast.error('Failed to update featured status'),
  });
};
