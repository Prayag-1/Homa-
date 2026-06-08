import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type {
  AdminBlogListParams,
  BlogListParams,
  CreateBlogPayload,
  UpdateBlogPayload,
} from '../services/blogService';
import {
  createBlog,
  deleteBlog,
  fetchAdminBlogById,
  fetchAdminBlogs,
  fetchBlogBySlug,
  fetchPublishedBlogs,
  togglePublishBlog,
  updateBlog,
} from '../services/blogService';

type BlogMutationInput = {
  values: CreateBlogPayload | UpdateBlogPayload;
  coverImageFile?: File | null;
};

export const useBlogs = (filters: BlogListParams) =>
  useQuery({
    queryKey: ['blogs', filters],
    queryFn: () => fetchPublishedBlogs(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 2,
  });

export const useBlog = (slug?: string) =>
  useQuery({
    queryKey: ['blog', slug],
    queryFn: () => fetchBlogBySlug(slug as string),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

export const useAdminBlogs = (filters: AdminBlogListParams) =>
  useQuery({
    queryKey: ['admin-blogs', filters],
    queryFn: () => fetchAdminBlogs(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30,
  });

export const useAdminBlog = (id?: string) =>
  useQuery({
    queryKey: ['admin-blog', id],
    queryFn: () => fetchAdminBlogById(id as string),
    enabled: !!id,
  });

export const useCreateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ values, coverImageFile }: BlogMutationInput) =>
      createBlog({
        ...(values as CreateBlogPayload),
        coverImageFile: coverImageFile || (values as CreateBlogPayload).coverImageFile || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create blog');
    },
  });
};

export const useUpdateBlog = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ values, coverImageFile }: BlogMutationInput) =>
      updateBlog(id, {
        ...(values as UpdateBlogPayload),
        coverImageFile: coverImageFile || (values as UpdateBlogPayload).coverImageFile || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog', id] });
      toast.success('Blog updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update blog');
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete blog');
    },
  });
};

export const useToggleBlogPublish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => togglePublishBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update blog status');
    },
  });
};
