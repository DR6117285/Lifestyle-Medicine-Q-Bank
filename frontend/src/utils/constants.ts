// Authentication and validation constants
export const AUTH_CONSTANTS = {
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Email validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Display name requirements
  MIN_DISPLAY_NAME_LENGTH: 2,
  MAX_DISPLAY_NAME_LENGTH: 50,
  
  // Session timeout (in milliseconds)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

// User roles
export const USER_ROLES = {
  LEARNER: 'learner',
  ADMIN: 'admin',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  QUIZ: '/quiz',
  ADMIN: '/admin',
  RESET_PASSWORD: '/reset-password',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_EMAIL: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be less than ${AUTH_CONSTANTS.MAX_PASSWORD_LENGTH} characters`,
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  
  // Display name errors
  DISPLAY_NAME_REQUIRED: 'Display name is required',
  DISPLAY_NAME_TOO_SHORT: `Display name must be at least ${AUTH_CONSTANTS.MIN_DISPLAY_NAME_LENGTH} characters`,
  DISPLAY_NAME_TOO_LONG: `Display name must be less than ${AUTH_CONSTANTS.MAX_DISPLAY_NAME_LENGTH} characters`,
  
  // General errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  
  // Specific auth errors from Supabase
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_CONFIRMED: 'Please check your email and click the confirmation link',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  SIGNUP_SUCCESS: 'Account created successfully',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully',
  EMAIL_CONFIRMATION_SENT: 'Confirmation email sent. Please check your inbox.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Animation durations (in milliseconds)
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 300,
  ANIMATION_DURATION_SLOW: 500,
  
  // Debounce delays (in milliseconds)
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_VALIDATION: 100,
  
  // Loading states
  LOADING_DELAY: 200, // Delay before showing loading spinner
  
  // Breakpoints (matches Tailwind CSS)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: AUTH_CONSTANTS.EMAIL_REGEX,
  // Allow letters, numbers, spaces, hyphens, and apostrophes for names
  DISPLAY_NAME: /^[a-zA-Z0-9\s\-']+$/,
  // Strong password: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_STATE: 'lmqb-auth-storage',
  THEME: 'lmqb-theme',
  PREFERENCES: 'lmqb-preferences',
  QUIZ_PROGRESS: 'lmqb-quiz-progress',
} as const;

// Quiz constants
export const QUIZ_CONSTANTS = {
  DEFAULT_TIME_LIMIT: 60, // minutes
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 100,
  DEFAULT_QUESTION_COUNT: 20,
} as const;

// API endpoints (relative to Supabase base URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/v1/token?grant_type=password',
    SIGNUP: '/auth/v1/signup',
    LOGOUT: '/auth/v1/logout',
    REFRESH: '/auth/v1/token?grant_type=refresh_token',
    RESET_PASSWORD: '/auth/v1/recover',
  },
  USERS: {
    PROFILE: '/rest/v1/user_profiles',
  },
  QUIZ: {
    SESSIONS: '/rest/v1/quiz_sessions',
    ATTEMPTS: '/rest/v1/quiz_attempts',
    QUESTIONS: '/rest/v1/questions',
  },
} as const;