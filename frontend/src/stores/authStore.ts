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

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            set({ user: null, isAuthenticated: false, isLoading: false, error: error.message });
            return;
          }

          if (session?.user) {
            // Fetch user profile from our database
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching user profile:', profileError);
              set({ error: 'Failed to fetch user profile' });
            }

            const user = transformSupabaseUser(session.user, profile);
            set({ user, isAuthenticated: true, isLoading: false, error: null });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null });
          }

          // Listen to auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Fetch user profile
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching user profile:', profileError);
              }

              const user = transformSupabaseUser(session.user, profile);
              set({ user, isAuthenticated: true, isLoading: false, error: null });
            } else if (event === 'SIGNED_OUT') {
              set({ user: null, isAuthenticated: false, isLoading: false, error: null });
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              // Update user data on token refresh
              await get().refreshUser();
            }
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to initialize authentication' 
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
            console.error('Login error:', error);
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
              console.error('Error fetching user profile:', profileError);
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
          console.error('Login error:', error);
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
            console.error('Signup error:', error);
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
          console.error('Signup error:', error);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('Logout error:', error);
            set({ error: error.message, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null });
          }
        } catch (error) {
          console.error('Logout error:', error);
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
            console.error('Profile update error:', profileError);
            set({ isLoading: false, error: profileError.message });
            return { success: false, error: profileError.message };
          }

          // Update local state
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser, isLoading: false, error: null });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
          console.error('Profile update error:', error);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      refreshUser: async () => {
        try {
          const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
          
          if (error || !supabaseUser) {
            console.error('Error refreshing user:', error);
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
            console.error('Error fetching user profile:', profileError);
            set({ error: 'Failed to fetch user profile' });
          }

          const user = transformSupabaseUser(supabaseUser, profile);
          set({ user, isAuthenticated: true, error: null });
        } catch (error) {
          console.error('Error refreshing user:', error);
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
        // Initialize auth after rehydration
        if (state) {
          state.initialize();
        }
      },
    }
  )
);