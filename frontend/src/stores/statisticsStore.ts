import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StatisticsService } from '../services/statisticsService';
import type {
  StatisticsState,
  StatisticsOverview,
  StatisticsFilters,
  StatisticsUpdateEvent
} from '../types/statistics';

interface StatisticsStore extends StatisticsState {
  // Actions
  fetchStatistics: (userId: string, forceRefresh?: boolean) => Promise<void>;
  refreshStatistics: (userId: string) => Promise<void>;
  updateFilters: (filters: Partial<StatisticsFilters>) => void;
  clearError: () => void;
  clearCache: () => void;
  handleQuizCompletion: (userId: string) => Promise<void>;
  
  // Getters
  isDataFresh: () => boolean;
  shouldRefresh: () => boolean;
}

const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useStatisticsStore = create<StatisticsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      statistics: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastFetch: null,
      cacheExpiry: DEFAULT_CACHE_EXPIRY,
      filters: {
        dateRange: {},
        limit: 10
      },

      // Actions
      fetchStatistics: async (userId: string, forceRefresh: boolean = false) => {
        const state = get();
        
        // Check if we should use cached data
        if (!forceRefresh && state.statistics && state.isDataFresh()) {
          return;
        }

        try {
          set({ 
            isLoading: state.statistics ? false : true, // Don't show loading if we have cached data
            isRefreshing: state.statistics ? true : false,
            error: null 
          });

          console.log('Fetching statistics for user:', userId, 'with filters:', state.filters);

          const response = await StatisticsService.getUserStatistics(userId, state.filters);

          if (response.success && response.data) {
            set({
              statistics: response.data,
              lastFetch: Date.now(),
              isLoading: false,
              isRefreshing: false,
              error: null
            });

            console.log('Statistics fetched successfully:', response.data);
          } else {
            const errorMessage = response.error || 'Failed to fetch statistics';
            console.error('Statistics fetch failed:', errorMessage);
            
            set({
              error: errorMessage,
              isLoading: false,
              isRefreshing: false
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
          console.error('Statistics fetch error:', error);
          
          set({
            error: errorMessage,
            isLoading: false,
            isRefreshing: false
          });
        }
      },

      refreshStatistics: async (userId: string) => {
        const state = get();
        
        try {
          set({ isRefreshing: true, error: null });

          // Refresh the materialized view first
          await StatisticsService.refreshStatistics();
          
          // Wait a moment for the view to refresh
          await new Promise(resolve => setTimeout(resolve, 500));

          // Fetch fresh data
          const response = await StatisticsService.getUserStatistics(userId, state.filters);

          if (response.success && response.data) {
            set({
              statistics: response.data,
              lastFetch: Date.now(),
              isRefreshing: false,
              error: null
            });

            console.log('Statistics refreshed successfully');
          } else {
            const errorMessage = response.error || 'Failed to refresh statistics';
            console.error('Statistics refresh failed:', errorMessage);
            
            set({
              error: errorMessage,
              isRefreshing: false
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh statistics';
          console.error('Statistics refresh error:', error);
          
          set({
            error: errorMessage,
            isRefreshing: false
          });
        }
      },

      updateFilters: (newFilters: Partial<StatisticsFilters>) => {
        const state = get();
        const updatedFilters = {
          ...state.filters,
          ...newFilters
        };

        set({ 
          filters: updatedFilters,
          // Clear cache when filters change to force refresh
          lastFetch: null,
          statistics: null
        });

        console.log('Statistics filters updated:', updatedFilters);
      },

      clearError: () => {
        set({ error: null });
      },

      clearCache: () => {
        set({ 
          statistics: null,
          lastFetch: null,
          error: null
        });
        console.log('Statistics cache cleared');
      },

      handleQuizCompletion: async (userId: string) => {
        console.log('Handling quiz completion, refreshing statistics...');
        
        // Invalidate cache immediately
        set({ lastFetch: null });
        
        // Refresh statistics after a short delay to allow database updates
        setTimeout(() => {
          get().refreshStatistics(userId);
        }, 1000);
      },

      // Getters
      isDataFresh: () => {
        const state = get();
        if (!state.lastFetch) return false;
        return Date.now() - state.lastFetch < state.cacheExpiry;
      },

      shouldRefresh: () => {
        const state = get();
        return !state.statistics || !state.isDataFresh();
      }
    }),
    {
      name: 'lmqb-statistics-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist statistics and timestamp, not loading states
        statistics: state.statistics,
        lastFetch: state.lastFetch,
        filters: state.filters
      }),
      onRehydrateStorage: () => (state) => {
        // Reset loading states after rehydration
        if (state) {
          state.isLoading = false;
          state.isRefreshing = false;
          state.error = null;
        }
      },
    }
  )
);

// Export utility hooks for common operations
export const useStatisticsData = () => {
  const store = useStatisticsStore();
  return {
    statistics: store.statistics,
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    error: store.error,
    isDataFresh: store.isDataFresh()
  };
};

export const useStatisticsActions = () => {
  const store = useStatisticsStore();
  return {
    fetchStatistics: store.fetchStatistics,
    refreshStatistics: store.refreshStatistics,
    updateFilters: store.updateFilters,
    clearError: store.clearError,
    clearCache: store.clearCache,
    handleQuizCompletion: store.handleQuizCompletion
  };
};

// Export selectors for specific data
export const useOverallStats = () => useStatisticsStore(state => state.statistics?.overall);
export const useSectionStats = () => useStatisticsStore(state => state.statistics?.sections || []);
export const useRecentSessions = () => useStatisticsStore(state => state.statistics?.recentSessions || []);
export const useProgressData = () => useStatisticsStore(state => state.statistics?.progressOverTime || []);
export const useRecommendations = () => useStatisticsStore(state => state.statistics?.recommendations || []);
export const useComparativeStats = () => useStatisticsStore(state => state.statistics?.comparative);