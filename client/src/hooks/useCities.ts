import { useQuery } from '@tanstack/react-query';
import { citiesService } from '../services/cities.service';

export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: citiesService.getCities,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCity = (slug: string) => {
  return useQuery({
    queryKey: ['city', slug],
    queryFn: () => citiesService.getCityBySlug(slug),
    enabled: !!slug,
  });
};
