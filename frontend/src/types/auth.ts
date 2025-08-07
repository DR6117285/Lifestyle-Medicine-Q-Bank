export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'learner' | 'admin';
  createdAt: string;
  lastActive: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  displayName: string;
}