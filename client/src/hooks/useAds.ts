import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsService } from '../services/ads.service';
import { Ad } from '../types';

export const useAds = (filters?: {
  page?: number;
  limit?: number;
  categoryId?: string;
  categorySlug?: string;
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['ads', filters],
    queryFn: () => adsService.getAds(filters),
  });
};

export const useAd = (id: string) => {
  return useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsService.getAd(id),
    enabled: !!id,
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsService.createAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });
};

export const useUpdateAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ad> }) =>
      adsService.updateAd(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad', variables.id] });
    },
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adsService.deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });
};

export const useUploadImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adId, files }: { adId: string; files: File[] }) =>
      adsService.uploadImages(adId, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad', variables.adId] });
    },
  });
};
