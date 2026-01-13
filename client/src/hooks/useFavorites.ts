// Custom Hook for Favorites
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesService } from '../services/api';

export function useFavorites() {
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesService.getFavorites,
  }) as { data: any[] | undefined; isLoading: boolean };

  const addMutation = useMutation({
    mutationFn: (adId: string) => favoritesService.addFavorite(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (adId: string) => favoritesService.removeFavorite(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const isFavorite = (adId: string) => {
    return favorites?.some((fav: any) => fav.adId === adId) || false;
  };

  const toggleFavorite = (adId: string) => {
    if (isFavorite(adId)) {
      removeMutation.mutate(adId);
    } else {
      addMutation.mutate(adId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
  };
}

export default useFavorites;
