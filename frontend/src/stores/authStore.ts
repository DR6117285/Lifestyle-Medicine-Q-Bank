import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../utils/supabaseClient';
import type { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js';
import type { User, AuthState, LoginCredentials, SignUpData } from '../types/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  error: string | null;
  // Internal state
  _isInitializing: boolean;
}

const transformSupabaseUser = (supabaseUser: SupabaseUser, profile?: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email!,
  displayName: profile?.display_name || supabaseUser.user_metadata?.display_name || supabaseUser.email!.split('@')[0],
  role: profile?.role || supabaseUser.user_metadata?.role || 'learner',
  createdAt: supabaseUser.created_at,
  lastActive: profile?.last_active || new Date().toISOString(),
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      _isInitializing: false,

      initialize: async () => {
        // Prevent multiple simultaneous initializations
        const state = get();
        if (state._isInitializing) {
          console.log('[AUTH] Initialization already in progress, skipping');
          return;
        }

        try {
          set({ _isInitializing: true });
          console.log('[AUTH] Starting initialization');
          console.debug('[AUTH] Environment:', { 
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          });
          set({ isLoading: true, error: null });
          
          // Get current session
          console.log('[AUTH] Getting session from Supabase');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[AUTH] Error getting session:', error);
            set({ user: null, isAuthenticated: false, isLoading: false, error: error.message });
            return;
          }

          console.log('[AUTH] Session result:', !!session?.user, 'Session valid:', !!session?.access_token);
          
          if (session?.user && session?.access_token) {
            console.log('[AUTH] Valid user session found, fetching profile');
            // Fetch user profile from our database
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('[AUTH] Error fetching user profile:', profileError);
              // Don't fail completely if profile fetch fails
              console.log('[AUTH] Continuing without profile data');
            }

            const user = transformSupabaseUser(session.user, profile);
            console.log('[AUTH] User authenticated successfully');
            set({ user, isAuthenticated: true, isLoading: false, error: null, _isInitializing: false });
          } else {
            console.log('[AUTH] No user session found');
            set({ user: null, isAuthenticated: false, isLoading: false, error: null, _isInitializing: false });
          }

          // Listen to auth changes
          console.log('[AUTH] Setting up auth state listener');
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AUTH] State change detected:', event, 'Session exists:', !!session);
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('[AUTH] User signed in, fetching profile');
              // Fetch user profile
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('[AUTH] Error fetching user profile on sign in:', profileError);
              }

              const user = transformSupabaseUser(session.user, profile);
              set({ user, isAuthenticated: true, isLoading: false, error: null });
            } else if (event === 'SIGNED_OUT') {
              console.log('[AUTH] User signed out, clearing state');
              set({ user: null, isAuthenticated: false, isLoading: false, error: null });
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('[AUTH] Token refreshed, updating user data');
              // Update user data on token refresh
              await get().refreshUser();
            } else if (event === 'INITIAL_SESSION' && !session) {
              console.log('[AUTH] Initial session check: no session found');
              set({ user: null, isAuthenticated: false, isLoading: false, error: null });
            }
          });
        } catch (error) {
          console.error('[AUTH] Fatal error during initialization:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to initialize authentication',
            _isInitializing: false
          });
        }
      },

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email.toLowerCase().trim(),
            password: credentials.password,
          });

          if (error) {
            console.error('[AUTH] Login error:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('[AUTH] Error fetching user profile:', profileError);
              set({ error: 'Failed to fetch user profile' });
            }

            const user = transformSupabaseUser(data.user, profile);
            set({ user, isAuthenticated: true, isLoading: false, error: null });
            return { success: true };
          }

          set({ isLoading: false, error: 'No user returned from login' });
          return { success: false, error: 'No user returned from login' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          console.error('[AUTH] Login error:', error);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      signup: async (data: SignUpData) => {
        try {
          set({ isLoading: true, error: null });

          const { data: authData, error } = await supabase.auth.signUp({
            email: data.email.toLowerCase().trim(),
            password: data.password,
            options: {
              data: {
                display_name: data.displayName.trim(),
                role: 'learner', // Default role for new users
              },
            },
          });

          if (error) {
            console.error('[AUTH] Signup error:', error);
            set({ isLoading: false, error: error.message });
            return { success: false, error: error.message };
          }

          if (authData.user && !authData.session) {
            // Email confirmation required
            set({ isLoading: false, error: null });
            return { 
              success: true, 
              error: 'Please check your email and click the confirmation link to complete your registration.' 
            };
          }

          if (authData.user && authData.session) {
            // Auto-confirmed (typically in development)
            const user = transformSupabaseUser(authData.user, {
              display_name: data.displayName.trim(),
              role: 'learner',
            });
            set({ user, isAuthenticated: true, isLoading: false, error: null });
            return { success: true };
          }

          set({ isLoading: false, error: 'Signup completed but no user returned' });
          return { success: false, error: 'Signup completed but no user returned' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Signup failed';
          console.error('[AUTH] Signup error:', error);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('[AUTH] Logout error:', error);
            set({ error: error.message, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null });
          }
        } catch (error) {
          console.error('[AUTH] Logout error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false 
          });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        try {
          const { user } = get();
          if (!user) {
            return { success: false, error: 'No user logged in' };
          }

          set({ isLoading: true, error: null });

          // Update user profile in our database
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              display_name: updates.displayName,
              role: updates.role,
            })
            .eq('id', user.id);

          if (profileError) {
            console.error('[AUTH] Profile update error:', profileError);
            set({ isLoading: false, error: profileError.message });
            return { success: false, error: profileError.message };
          }

          // Update local state
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser, isLoading: false, error: null });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
          console.error('[AUTH] Profile update error:', error);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      refreshUser: async () => {
        try {
          const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
          
          if (error || !supabaseUser) {
            console.error('[AUTH] Error refreshing user:', error);
            set({ user: null, isAuthenticated: false, error: error?.message || 'Failed to refresh user' });
            return;
          }

          // Fetch updated profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('[AUTH] Error fetching user profile:', profileError);
            set({ error: 'Failed to fetch user profile' });
          }

          const user = transformSupabaseUser(supabaseUser, profile);
          set({ user, isAuthenticated: true, error: null });
        } catch (error) {
          console.error('[AUTH] Error refreshing user:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh user' 
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'lmqb-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth after rehydration only if needed
        if (state && !state._isInitializing && !state.isAuthenticated) {
          console.log('[AUTH] Rehydrating auth state, scheduling initialization');
          // Use setTimeout to ensure rehydration is complete before initialization
          setTimeout(() => {
            // Double check state hasn't changed during setTimeout
            if (!state._isInitializing) {
              state.initialize();
            }
          }, 100);
        } else if (state && state.isAuthenticated) {
          console.log('[AUTH] Rehydrating with existing auth state, skipping initialization');
          // Set loading to false for rehydrated authenticated state
          state.isLoading = false;
        }
      },
    }
  )
);