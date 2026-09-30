import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type {
  AdminTransformationStoryListParams,
  CreateTransformationStoryPayload,
  TransformationStoryListParams,
  UpdateTransformationStoryPayload,
} from '../services/transformationStoryService';
import {
  createTransformationStory,
  deleteTransformationStory,
  fetchAdminTransformationStoryById,
  fetchAdminTransformationStories,
  fetchPublishedTransformationStories,
  fetchRelatedTransformationStories,
  fetchTransformationStoryBySlug,
  togglePublishTransformationStory,
  updateTransformationStory,
} from '../services/transformationStoryService';

type StoryMutationInput = {
  values: CreateTransformationStoryPayload | UpdateTransformationStoryPayload;
  coverImageFile?: File | null;
  beforeImageFile?: File | null;
  afterImageFile?: File | null;
};

export const useTransformationStories = (filters: TransformationStoryListParams) =>
  useQuery({
    queryKey: ['transformation-stories', filters],
    queryFn: () => fetchPublishedTransformationStories(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 2,
  });

export const useTransformationStory = (slug?: string) =>
  useQuery({
    queryKey: ['transformation-story', slug],
    queryFn: () => fetchTransformationStoryBySlug(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

export const useRelatedTransformationStories = (slug?: string) =>
  useQuery({
    queryKey: ['related-transformation-stories', slug],
    queryFn: () => fetchRelatedTransformationStories(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

export const useAdminTransformationStories = (filters: AdminTransformationStoryListParams) =>
  useQuery({
    queryKey: ['admin-transformation-stories', filters],
    queryFn: () => fetchAdminTransformationStories(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

export const useAdminTransformationStory = (id?: string) =>
  useQuery({
    queryKey: ['admin-transformation-story', id],
    queryFn: () => fetchAdminTransformationStoryById(id as string),
    enabled: !!id,
  });

export const useCreateTransformationStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ values, coverImageFile, beforeImageFile, afterImageFile }: StoryMutationInput) =>
      createTransformationStory({
        ...(values as CreateTransformationStoryPayload),
        coverImageFile: coverImageFile || (values as CreateTransformationStoryPayload).coverImageFile || null,
        beforeImageFile: beforeImageFile || (values as CreateTransformationStoryPayload).beforeImageFile || null,
        afterImageFile: afterImageFile || (values as CreateTransformationStoryPayload).afterImageFile || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transformation-stories'] });
      queryClient.invalidateQueries({ queryKey: ['transformation-stories'] });
      toast.success('Transformation story created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create transformation story');
    },
  });
};

export const useUpdateTransformationStory = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ values, coverImageFile, beforeImageFile, afterImageFile }: StoryMutationInput) =>
      updateTransformationStory(id, {
        ...(values as UpdateTransformationStoryPayload),
        coverImageFile: coverImageFile || (values as UpdateTransformationStoryPayload).coverImageFile || null,
        beforeImageFile: beforeImageFile || (values as UpdateTransformationStoryPayload).beforeImageFile || null,
        afterImageFile: afterImageFile || (values as UpdateTransformationStoryPayload).afterImageFile || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transformation-stories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transformation-story', id] });
      queryClient.invalidateQueries({ queryKey: ['transformation-stories'] });
      toast.success('Transformation story updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update transformation story');
    },
  });
};

export const useDeleteTransformationStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransformationStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transformation-stories'] });
      queryClient.invalidateQueries({ queryKey: ['transformation-stories'] });
      toast.success('Transformation story deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete transformation story');
    },
  });
};

export const useTogglePublishTransformationStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => togglePublishTransformationStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transformation-stories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transformation-story'] });
      queryClient.invalidateQueries({ queryKey: ['transformation-stories'] });
      toast.success('Transformation story status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update transformation story status');
    },
  });
};
