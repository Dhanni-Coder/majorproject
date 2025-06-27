/**
 * Application Constants
 */

// API URL - Using the proxy configuration in vite.config.js
export const API_URL = '/api';

// Authentication
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

// Pagination
export const DEFAULT_PAGE_SIZE = 12;

// Date formats
export const DATE_FORMAT = {
  FULL: { year: 'numeric', month: 'long', day: 'numeric' },
  SHORT: { year: 'numeric', month: 'short', day: 'numeric' }
};

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
