import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../stores/authStore';

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

const mockStore = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  refreshUser: vi.fn(),
  initialize: vi.fn(),
  clearError: vi.fn(),
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue(mockStore);
  });

  it('should return auth state and actions', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toMatchObject({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      login: expect.any(Function),
      signup: expect.any(Function),
      logout: expect.any(Function),
      updateProfile: expect.any(Function),
      refreshUser: expect.any(Function),
      initialize: expect.any(Function),
      clearError: expect.any(Function),
      hasRole: expect.any(Function),
      isAdmin: expect.any(Function),
      isLearner: expect.any(Function),
      getDisplayName: expect.any(Function),
      getUserInitials: expect.any(Function),
      isSessionValid: expect.any(Function),
      getLastActiveFormatted: expect.any(Function),
    });
  });

  describe('role checking utilities', () => {
    it('should check if user has specific role', () => {
      const mockLearnerUser = {
        id: '123',
        email: 'learner@example.com',
        displayName: 'Learner User',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockLearnerUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole('learner')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.isLearner()).toBe(true);
      expect(result.current.isAdmin()).toBe(false);
    });

    it('should return false for role checks when no user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole('learner')).toBe(false);
      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.isLearner()).toBe(false);
      expect(result.current.isAdmin()).toBe(false);
    });
  });

  describe('display utilities', () => {
    it('should get display name from user', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getDisplayName()).toBe('Test User');
    });

    it('should fallback to email for display name', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: '',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getDisplayName()).toBe('test');
    });

    it('should return empty string for display name when no user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.getDisplayName()).toBe('');
    });

    it('should get user initials', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'John Doe',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getUserInitials()).toBe('JD');
    });

    it('should get initials from single name', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'John',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getUserInitials()).toBe('JO');
    });

    it('should get initials from email when no display name', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: '',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getUserInitials()).toBe('TE');
    });
  });

  describe('session validation', () => {
    it('should validate session correctly', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isSessionValid()).toBe(true);
    });

    it('should return false for invalid session', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isSessionValid()).toBe(false);
    });
  });

  describe('last active formatting', () => {
    it('should format recent activity as "Just now"', () => {
      const now = new Date();
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: now.toISOString(),
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getLastActiveFormatted()).toBe('Just now');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: twoHoursAgo.toISOString(),
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getLastActiveFormatted()).toBe('2 hours ago');
    });

    it('should return "Never" when no last active date', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'learner' as const,
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '',
      };

      vi.mocked(useAuthStore).mockReturnValue({
        ...mockStore,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.getLastActiveFormatted()).toBe('Never');
    });
  });

  describe('action wrappers', () => {
    it('should handle login with error handling', async () => {
      mockStore.login.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(loginResult.success).toBe(true);
      });

      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockStore.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle signup with error handling', async () => {
      mockStore.signup.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const signupResult = await result.current.signup({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
        });
        expect(signupResult.success).toBe(true);
      });

      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockStore.signup).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });
    });

    it('should handle logout with error handling', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockStore.logout).toHaveBeenCalled();
    });

    it('should handle profile update with error handling', async () => {
      mockStore.updateProfile.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const updateResult = await result.current.updateProfile({
          displayName: 'New Name',
        });
        expect(updateResult.success).toBe(true);
      });

      expect(mockStore.clearError).toHaveBeenCalled();
      expect(mockStore.updateProfile).toHaveBeenCalledWith({
        displayName: 'New Name',
      });
    });
  });
});