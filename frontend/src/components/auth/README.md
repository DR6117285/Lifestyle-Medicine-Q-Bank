# LMQB Authentication System

This directory contains the complete authentication system for the Lifestyle Medicine Question Bank (LMQB) application.

## Overview

The authentication system is built using:
- **Supabase Auth** for backend authentication services
- **Zustand** for state management
- **React Router** for navigation and route protection
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## Architecture

### Core Components

1. **AuthStore** (`/stores/authStore.ts`)
   - Centralized state management using Zustand
   - Handles authentication state persistence
   - Manages user sessions and profile data
   - Integrates with Supabase Auth APIs

2. **useAuth Hook** (`/hooks/useAuth.ts`)
   - Custom React hook providing auth functionality
   - Wrapper around the auth store with enhanced utilities
   - Role-based access control helpers
   - User display utilities

3. **UI Components** (`/components/auth/`)
   - `LoginForm.tsx` - Email/password login with validation
   - `SignupForm.tsx` - User registration with profile creation
   - `AuthLayout.tsx` - Branded layout for auth pages
   - `ProtectedRoute.tsx` - Route protection and authorization

4. **Pages** (`/pages/`)
   - `Login.tsx` - Login/signup page with mode switching

## Features

### Authentication
- ✅ Email/password authentication
- ✅ User registration with automatic profile creation
- ✅ Email confirmation support
- ✅ Session management and persistence
- ✅ Automatic token refresh
- ✅ Secure logout

### Authorization
- ✅ Role-based access control (learner/admin)
- ✅ Protected routes
- ✅ Conditional rendering based on roles
- ✅ Automatic redirects based on user role

### User Experience
- ✅ Loading states and error handling
- ✅ Form validation with real-time feedback
- ✅ Password strength indicator
- ✅ Responsive design
- ✅ Accessibility support
- ✅ User profile management

### Security
- ✅ Input validation and sanitization
- ✅ Secure password requirements
- ✅ XSS protection
- ✅ CSRF protection via Supabase
- ✅ Secure session storage

## Usage

### Basic Setup

1. **Initialize Auth in App Root**
```tsx
import { useAuth } from './hooks/useAuth';

function App() {
  const { initialize, isLoading } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <YourAppContent />;
}
```

2. **Protect Routes**
```tsx
import { ProtectedRoute, AdminProtectedRoute } from './components/auth/ProtectedRoute';

// Require authentication
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Require admin role
<AdminProtectedRoute>
  <AdminPanel />
</AdminProtectedRoute>

// Specific role requirement
<ProtectedRoute requiredRole="learner">
  <LearnerDashboard />
</ProtectedRoute>
```

3. **Use Auth Data**
```tsx
import { useAuth } from './hooks/useAuth';

function UserProfile() {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    getDisplayName,
    getUserInitials,
    logout 
  } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {getDisplayName()}!</h1>
      <div className="avatar">
        {getUserInitials()}
      </div>
      {isAdmin() && <AdminControls />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

4. **Handle Authentication**
```tsx
import { useAuth } from './hooks/useAuth';

function LoginPage() {
  const { login, signup, isLoading, error } = useAuth();

  const handleLogin = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }
  };

  return (
    <LoginForm onSubmit={handleLogin} loading={isLoading} error={error} />
  );
}
```

## State Management

### Auth Store State
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
```

### User Object
```typescript
interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'learner' | 'admin';
  createdAt: string;
  lastActive: string;
}
```

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: Invalid credentials, expired sessions
- **Authorization Errors**: Insufficient permissions
- **Validation Errors**: Invalid input format, missing fields
- **Server Errors**: Backend service issues

Errors are displayed to users with appropriate messaging and recovery options.

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Strength indicator for user feedback

### Session Security
- Automatic token refresh
- Secure storage (httpOnly cookies via Supabase)
- Session timeout handling
- Logout on token expiration

### Input Validation
- Email format validation
- Display name character restrictions
- XSS prevention through proper encoding
- SQL injection protection via Supabase ORM

## Database Integration

### User Profiles Table
The system integrates with the `user_profiles` table:

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'learner',
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);
```

### Automatic Profile Creation
User profiles are automatically created via database triggers when users register through Supabase Auth.

## Testing

The system includes comprehensive tests:

- **Unit Tests**: Individual component and hook testing
- **Integration Tests**: Auth flow testing
- **Store Tests**: State management testing
- **Route Protection Tests**: Access control testing

Run tests with:
```bash
npm test
```

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

When contributing to the auth system:

1. Follow TypeScript strict mode requirements
2. Include comprehensive error handling
3. Add appropriate tests for new functionality
4. Update documentation for API changes
5. Follow existing code patterns and styling

## Troubleshooting

### Common Issues

1. **Session not persisting**: Check localStorage permissions and Supabase configuration
2. **Route protection not working**: Ensure `ProtectedRoute` is properly implemented
3. **Profile not created**: Check database triggers and RLS policies
4. **Token refresh failing**: Verify Supabase project settings and network connectivity

### Debug Mode

Enable debug logging by setting localStorage:
```javascript
localStorage.setItem('debug', 'auth');
```

This will log auth state changes and API calls to the browser console.