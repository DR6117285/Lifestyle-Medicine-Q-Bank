import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../authStore';
import { supabase } from '../../utils/supabaseClient';

// Mock Supabase
vi.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearError();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initialize', () => {
    it('should initialize with no session', async () => {
      const mockGetSession = vi.mocked(supabase.auth.getSession);
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange);
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: {} },
      } as any);

      const store = useAuthStore.getState();
      await store.initialize();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.isLoading).toBe(false);
    });

    it('should initialize with existing session', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {
          display_name: 'Test User',
          role: 'learner',
        },
      };

      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        display_name: 'Test User',
        role: 'learner',
        last_active: '2024-01-01T00:00:00Z',
      };

      const mockGetSession = vi.mocked(supabase.auth.getSession);
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'token',
            refresh_token: 'refresh',
          } 
        },
        error: null,
      });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      } as any);

      const mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange);
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: {} },
      } as any);

      const store = useAuthStore.getState();
      await store.initialize();

      expect(store.user).toEqual({
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'learner',
        createdAt: '2024-01-01T00:00:00Z',
        lastActive: '2024-01-01T00:00:00Z',
      });
      expect(store.isAuthenticated).toBe(true);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {
          display_name: 'Test User',
        },
      };

      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
      mockSignIn.mockResolvedValue({
        data: { 
          user: mockUser,
          session: { access_token: 'token' },
        },
        error: null,
      });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: '123',
                email: 'test@example.com',
                display_name: 'Test User',
                role: 'learner',
              },
              error: null,
            }),
          })),
        })),
      } as any);

      const store = useAuthStore.getState();
      const result = await store.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(store.user).toBeTruthy();
      expect(store.isAuthenticated).toBe(true);
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login error', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
      mockSignIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' } as any,
      });

      const store = useAuthStore.getState();
      const result = await store.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('signup', () => {
    it('should signup successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {
          display_name: 'Test User',
        },
      };

      const mockSignUp = vi.mocked(supabase.auth.signUp);
      mockSignUp.mockResolvedValue({
        data: { 
          user: mockUser,
          session: { access_token: 'token' },
        },
        error: null,
      });

      const store = useAuthStore.getState();
      const result = await store.signup({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'Test User',
            role: 'learner',
          },
        },
      });
    });

    it('should handle email confirmation required', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSignUp = vi.mocked(supabase.auth.signUp);
      mockSignUp.mockResolvedValue({
        data: { 
          user: mockUser,
          session: null, // No session means email confirmation required
        },
        error: null,
      });

      const store = useAuthStore.getState();
      const result = await store.signup({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.error).toContain('check your email');
    });

    it('should handle signup error', async () => {
      const mockSignUp = vi.mocked(supabase.auth.signUp);
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already exists' } as any,
      });

      const store = useAuthStore.getState();
      const result = await store.signup({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockSignOut = vi.mocked(supabase.auth.signOut);
      mockSignOut.mockResolvedValue({ error: null });

      // Set initial authenticated state
      const store = useAuthStore.getState();
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'learner',
          createdAt: '2024-01-01T00:00:00Z',
          lastActive: '2024-01-01T00:00:00Z',
        },
        isAuthenticated: true,
      });

      await store.logout();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Old Name',
          role: 'learner',
          createdAt: '2024-01-01T00:00:00Z',
          lastActive: '2024-01-01T00:00:00Z',
        },
        isAuthenticated: true,
      });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        })),
      } as any);

      const store = useAuthStore.getState();
      const result = await store.updateProfile({
        displayName: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(store.user?.displayName).toBe('New Name');
    });

    it('should handle update profile error', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'learner',
          createdAt: '2024-01-01T00:00:00Z',
          lastActive: '2024-01-01T00:00:00Z',
        },
        isAuthenticated: true,
      });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        })),
      } as any);

      const store = useAuthStore.getState();
      const result = await store.updateProfile({
        displayName: 'New Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });
});