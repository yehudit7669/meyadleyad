import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useFavorites from '../src/hooks/useFavorites';
import { favoritesService } from '../src/services/api';

// Mock the API service
vi.mock('../src/services/api', () => ({
  favoritesService: {
    getFavorites: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    isFavorite: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFavorites Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should fetch favorites successfully', async () => {
      const mockFavorites = [
        {
          id: 1,
          ad: {
            id: 1,
            title: 'דירה למכירה',
            price: 1000000,
            category: { nameHe: 'נדל"ן' },
            city: { nameHe: 'תל אביב' },
          },
        },
        {
          id: 2,
          ad: {
            id: 2,
            title: 'רכב למכירה',
            price: 50000,
            category: { nameHe: 'רכב' },
            city: { nameHe: 'ירושלים' },
          },
        },
      ];

      (favoritesService.getFavorites as any).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorites).toEqual(mockFavorites);
      });
    });

    it('should handle empty favorites list', async () => {
      (favoritesService.getFavorites as any).mockResolvedValue([]);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorites).toEqual([]);
      });
    });

    it('should set loading state while fetching', () => {
      (favoritesService.getFavorites as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('addFavorite', () => {
    it('should add ad to favorites', async () => {
      const adId = '5';

      (favoritesService.getFavorites as any).mockResolvedValue([]);
      (favoritesService.addFavorite as any).mockResolvedValue({
        id: 1,
        adId,
      });

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.addFavorite(adId);

      await waitFor(() => {
        expect(favoritesService.addFavorite).toHaveBeenCalledWith(adId);
      });
    });

    it('should update favorites count after adding', async () => {
      const mockInitialFavorites = [
        { id: 1, adId: '1' },
      ];

      (favoritesService.getFavorites as any).mockResolvedValue(
        mockInitialFavorites
      );
      (favoritesService.addFavorite as any).mockResolvedValue({
        id: 2,
        adId: '2',
      });

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(1);
      });

      result.current.addFavorite('2');

      await waitFor(() => {
        expect(favoritesService.addFavorite).toHaveBeenCalled();
      });
    });
  });

  describe('removeFavorite', () => {
    it('should remove ad from favorites', async () => {
      const adId = '3';

      (favoritesService.getFavorites as any).mockResolvedValue([
        { id: 1, adId: adId },
      ]);
      (favoritesService.removeFavorite as any).mockResolvedValue({});

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.removeFavorite(adId);

      await waitFor(() => {
        expect(favoritesService.removeFavorite).toHaveBeenCalledWith(adId);
      });
    });

    it('should update favorites count after removing', async () => {
      const mockFavorites = [
        { id: 1, adId: '1' },
        { id: 2, adId: '2' },
      ];

      (favoritesService.getFavorites as any).mockResolvedValue(mockFavorites);
      (favoritesService.removeFavorite as any).mockResolvedValue({});

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(2);
      });

      result.current.removeFavorite('1');

      await waitFor(() => {
        expect(favoritesService.removeFavorite).toHaveBeenCalled();
      });
    });
  });

  describe('isFavorite', () => {
    it('should return true for favorited ad', async () => {
      const adId = '10';

      (favoritesService.getFavorites as any).mockResolvedValue([
        { id: 1, adId: adId },
      ]);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const isFav = result.current.isFavorite(adId);

      expect(isFav).toBe(true);
    });

    it('should return false for non-favorited ad', async () => {
      (favoritesService.getFavorites as any).mockResolvedValue([]);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const isFav = result.current.isFavorite('99');

      expect(isFav).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite if not already favorited', async () => {
      const adId = '7';

      (favoritesService.getFavorites as any).mockResolvedValue([]);
      (favoritesService.addFavorite as any).mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.toggleFavorite(adId);

      await waitFor(() => {
        expect(favoritesService.addFavorite).toHaveBeenCalledWith(adId);
      });
    });

    it('should remove favorite if already favorited', async () => {
      const adId = '8';

      (favoritesService.getFavorites as any).mockResolvedValue([
        { id: 1, adId: adId },
      ]);
      (favoritesService.removeFavorite as any).mockResolvedValue({});

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.toggleFavorite(adId);

      await waitFor(() => {
        expect(favoritesService.removeFavorite).toHaveBeenCalledWith(adId);
      });
    });
  });

  describe('Favorites Count', () => {
    it('should return correct count of favorites', async () => {
      const mockFavorites = [
        { id: 1, adId: '1' },
        { id: 2, adId: '2' },
        { id: 3, adId: '3' },
      ];

      (favoritesService.getFavorites as any).mockResolvedValue(mockFavorites);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(3);
      });
    });

    it('should return 0 when no favorites', async () => {
      (favoritesService.getFavorites as any).mockResolvedValue([]);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(0);
      });
    });
  });
});
