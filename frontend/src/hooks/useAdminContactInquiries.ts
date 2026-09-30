import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  deleteContactInquiry,
  fetchAdminContactInquiryById,
  fetchAdminContactInquiries,
  updateContactInquiryStatus,
} from '../services/contactService';

export const useAdminContactInquiries = (filters = {}) =>
  useQuery({
    queryKey: ['admin-contact-inquiries', filters],
    queryFn: () => fetchAdminContactInquiries(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

export const useAdminContactInquiry = (id?: string) =>
  useQuery({
    queryKey: ['admin-contact-inquiry', id],
    queryFn: () => fetchAdminContactInquiryById(id as string),
    enabled: Boolean(id),
  });

export const useUpdateContactInquiryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateContactInquiryStatus(id, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-inquiry'] });
      toast.success('Inquiry status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update inquiry status');
    },
  });
};

export const useDeleteContactInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContactInquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-inquiry'] });
      toast.success('Inquiry deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete inquiry');
    },
  });
};
