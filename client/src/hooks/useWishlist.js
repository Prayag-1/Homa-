import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';
import api from '../services/api';

export const useWishlist = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Fetch wishlist from API if logged in
  const { data: apiWishlist, isLoading, isError } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/user/wishlist').then((r) => r.data.data),
    enabled: !!user,
  });

  // Initialize wishlist from API or localStorage
  useEffect(() => {
    if (user && apiWishlist) {
      const ids = new Set(apiWishlist.map((p) => p._id));
      setWishlistIds(ids);
    } else if (!user) {
      const stored = localStorage.getItem('homa_wishlist');
      const ids = stored ? new Set(JSON.parse(stored)) : new Set();
      setWishlistIds(ids);
    }
  }, [user, apiWishlist]);

  // API mutation for logged-in users
  const toggleMutation = useMutation({
    mutationFn: (productId) =>
      api.post(`/user/wishlist/${productId}`).then((r) => r.data),
    onMutate: (productId) => {
      const previousIds = new Set(wishlistIds);

      setWishlistIds((prev) => {
        const updated = new Set(prev);
        if (updated.has(productId)) {
          updated.delete(productId);
        } else {
          updated.add(productId);
        }
        return updated;
      });

      return { previousIds };
    },
    onError: (error, productId, context) => {
      if (context?.previousIds) setWishlistIds(context.previousIds);
      toast.error(error.response?.data?.message || 'Wishlist update failed');
    },
    onSettled: () => {
      if (user) {
        qc.invalidateQueries({ queryKey: ['wishlist'] });
      }
    },
  });

  const toggle = useCallback(
    (productId) => {
      if (user) {
        toggleMutation.mutate(productId);
      } else {
        setWishlistIds((prev) => {
          const updated = new Set(prev);
          const id = String(productId);
          if (updated.has(id)) {
            updated.delete(id);
          } else {
            updated.add(id);
          }
          localStorage.setItem('homa_wishlist', JSON.stringify([...updated]));
          return updated;
        });
      }
    },
    [user, toggleMutation]
  );

  const isInWishlist = useCallback(
    (productId) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return {
    wishlistIds,
    products: apiWishlist || [],
    toggle,
    isInWishlist,
    isLoading,
    isError,
  };
};
