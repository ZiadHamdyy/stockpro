/**
 * Application-wide Constants
 * Centralized configuration for application settings
 */
export const APP_CONSTANTS = {
  // Application Information
  APP: {
    NAME: 'StockPro Platform',
    VERSION: '1.0.0',
    DESCRIPTION: 'The StockPro Platform API',
    AUTHOR: 'StockPro Platform Team',
  },

  // API Configuration
  API: {
    PREFIX: 'api/v1',
    DOCS_PATH: 'api/docs',
    HEALTH_CHECK_PATH: 'health',
  },

  // Database Configuration
  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 30000, // 30 seconds
    QUERY_TIMEOUT: 10000, // 10 seconds
  },

  // File Upload Configuration
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
    UPLOAD_DIR: './uploads',
  },

  // Pagination Configuration
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Validation Configuration
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
    UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },

  // Cache Configuration
  CACHE: {
    TTL: 300, // 5 minutes
    MAX_ITEMS: 1000,
  },

  // Logging Configuration
  LOGGING: {
    LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    MAX_FILES: 5,
    MAX_SIZE: '10m',
  },
} as const;

// Type definitions
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type ImageType = typeof APP_CONSTANTS.UPLOAD.ALLOWED_IMAGE_TYPES[number];
export type DocumentType = typeof APP_CONSTANTS.UPLOAD.ALLOWED_DOCUMENT_TYPES[number];
