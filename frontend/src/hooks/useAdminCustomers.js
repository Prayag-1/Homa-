import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';

export const useAdminCustomers = (filters = {}) =>
  useQuery({
    queryKey: ['admin-customers', filters],
    queryFn: () => api.get('/admin/customers', { params: filters }).then((res) => res.data.data),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

export const useAdminCustomer = (id) =>
  useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => api.get(`/admin/customers/${id}`).then((res) => res.data.data),
    enabled: Boolean(id),
  });

export const useToggleCustomerActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.patch(`/admin/customers/${id}/toggle`).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customer', data.data?._id] });
      toast.success(data.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update customer'),
  });
};
