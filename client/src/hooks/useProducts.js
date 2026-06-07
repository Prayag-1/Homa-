import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useProducts = (filters) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.get('/products', { params: filters }).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

export const useProduct = (id) =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

export const useNewArrivals = () =>
  useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => api.get('/products/new-arrivals').then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

export const useBestSellers = () =>
  useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: () => api.get('/products/best-sellers').then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

export const useProductReviews = (productId) =>
  useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.get(`/products/${productId}/reviews`).then((r) => r.data.data),
    enabled: !!productId,
  });

export const useSubmitReview = (productId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/products/${productId}/reviews`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', productId] }),
  });
};
