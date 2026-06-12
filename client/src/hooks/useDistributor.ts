import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { DistributorPayload, DistributorQuery } from '../services/distributorService';
import {
  createDistributor,
  deleteDistributor,
  fetchAdminDistributors,
  fetchPublicDistributors,
  toggleDistributorActive,
  updateDistributor,
} from '../services/distributorService';

export const useDistributors = () =>
  useQuery({
    queryKey: ['distributors'],
    queryFn: fetchPublicDistributors,
    staleTime: 1000 * 60 * 5,
  });

export const useAdminDistributors = (filters: DistributorQuery = {}) =>
  useQuery({
    queryKey: ['admin-distributors', filters],
    queryFn: () => fetchAdminDistributors(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

export const useCreateDistributor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DistributorPayload) => createDistributor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toast.success('Distributor created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create distributor');
    },
  });
};

export const useUpdateDistributor = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DistributorPayload) => updateDistributor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toast.success('Distributor updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update distributor');
    },
  });
};

export const useToggleDistributorActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleDistributorActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toast.success('Distributor status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update distributor status');
    },
  });
};

export const useDeleteDistributor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDistributor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-distributors'] });
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toast.success('Distributor deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete distributor');
    },
  });
};
