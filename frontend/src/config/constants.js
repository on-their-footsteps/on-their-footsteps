/**
 * Application configuration constants
 * Centralized configuration for better maintainability
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  MAX_RETRIES: 2,
  RETRY_DELAY: 5000,
  CACHE_TTL: {
    CHARACTERS: 10 * 60 * 1000, // 10 minutes
    CATEGORIES: 30 * 60 * 1000, // 30 minutes
    USER: 5 * 60 * 1000, // 5 minutes
    SEARCH: 2 * 60 * 1000, // 2 minutes
    FEATURED: 10 * 60 * 1000 // 10 minutes
  }
};

// Application Configuration
export const APP_CONFIG = {
  NAME: 'On Their Footsteps',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.MODE || 'development',
  DEBUG: import.meta.env.DEV
};

// UI Configuration
export const UI_CONFIG = {
  PAGINATION: {
    DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1
  },
  DEBOUNCE: {
    SEARCH: 300,
    VIEW_INCREMENT: 300000, // 5 minutes
    SCROLL: 150
  },
  TOAST: {
    DURATION: {
      SUCCESS: 3000,
      ERROR: 5000,
      WARNING: 4000,
      INFO: 2000
    },
    POSITION: 'top-right'
  },
  ANIMATION: {
    DURATION: 300,
    EASING: 'ease-in-out'
  }
};

// Islamic Categories
export const ISLAMIC_CATEGORIES = [
  'الأنبياء',
  'الصحابة', 
  'التابعون',
  'العلماء',
  'الخلفاء',
  'القادة',
  'الفقهاء',
  'المحدثون',
  'المفكرون'
];

// Valid Eras
export const VALID_ERAS = [
  'Pre-Islamic',
  'Early Islam', 
  'Rashidun Caliphate',
  'Umayyad Caliphate',
  'Abbasid Caliphate',
  'Ottoman Empire',
  'Modern Era',
  '7th Century',
  '8th Century',
  '9th Century',
  '10th Century',
  '11th Century',
  '12th Century',
  '13th Century',
  '14th Century',
  '15th Century'
];

// Validation Rules
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  TITLE: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 200
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000
  },
  SEARCH_QUERY: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  YEAR: {
    MIN: 500,
    MAX: 2024
  },
  SLUG: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100
  },
  EMAIL: {
    MAX_LENGTH: 254
  },
  URL: {
    MAX_LENGTH: 2048
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Connection error. Please check your internet connection.',
  AUTHENTICATION: 'Please log in to continue.',
  PERMISSION: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
  STORAGE: 'Storage is not available. Some features may be limited.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful!',
  LOGOUT: 'Logged out successfully.',
  REGISTER: 'Registration successful!',
  PROFILE_UPDATE: 'Profile updated successfully!',
  CHARACTER_LIKED: 'Character added to favorites!',
  CHARACTER_UNLIKED: 'Character removed from favorites.',
  CHARACTER_SHARED: 'Character shared successfully!',
  LESSON_COMPLETED: 'Lesson completed successfully!',
  ACHIEVEMENT_UNLOCKED: 'Achievement unlocked!'
};

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT: 'light',
  OPTIONS: ['light', 'dark', 'auto'],
  STORAGE_KEY: 'theme'
};

// Language Configuration
export const LANGUAGE_CONFIG = {
  DEFAULT: 'en',
  OPTIONS: ['en', 'ar'],
  STORAGE_KEY: 'language'
};

// Performance Monitoring
export const PERFORMANCE_CONFIG = {
  ENABLED: !import.meta.env.DEV,
  SAMPLE_RATE: 0.1, // 10% sampling
  CORE_WEB_VITALS: {
    LCP: { GOOD: 2500, POOR: 4000 },
    FID: { GOOD: 100, POOR: 300 },
    CLS: { GOOD: 0.1, POOR: 0.25 },
    INP: { GOOD: 200, POOR: 500 }
  },
  STORAGE_KEY: 'performance_metrics'
};

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 100,
  STORAGE_KEY_PREFIX: 'cache_',
  CLEANUP_INTERVAL: 60 * 60 * 1000 // 1 hour
};

// Feature Flags
export const FEATURES = {
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE === 'true',
  ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
  PUSH_NOTIFICATIONS: import.meta.env.VITE_ENABLE_PUSH === 'true'
};

// Routes
export const ROUTES = {
  HOME: '/',
  CHARACTERS: '/characters',
  CHARACTER_DETAIL: '/characters/:id',
  CATEGORIES: '/categories',
  LEARNING: '/learning',
  TIMELINE: '/timeline',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  CONTACT: '/contact',
  NOT_FOUND: '/404'
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

// Colors
export const COLORS = {
  PRIMARY: '#1e40af',
  SECONDARY: '#dc2626',
  SUCCESS: '#16a34a',
  WARNING: '#f59e0b',
  ERROR: '#dc2626',
  INFO: '#2563eb',
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

// Export all configurations as default
export default {
  API_CONFIG,
  APP_CONFIG,
  UI_CONFIG,
  ISLAMIC_CATEGORIES,
  VALID_ERAS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  THEME_CONFIG,
  LANGUAGE_CONFIG,
  PERFORMANCE_CONFIG,
  CACHE_CONFIG,
  FEATURES,
  ROUTES,
  BREAKPOINTS,
  COLORS
};
