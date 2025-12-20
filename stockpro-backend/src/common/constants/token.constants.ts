/**
 * Token Configuration Constants
 * Centralized configuration for JWT tokens and authentication
 */
export const TOKEN_CONSTANTS = {
  // Access Token Configuration
  ACCESS_TOKEN: {
    EXPIRES_IN: '30m', // 15 minutes
    ALGORITHM: 'HS256' as const,
    TYPE: 'access' as const,
  },

  // Refresh Token Configuration
  REFRESH_TOKEN: {
    EXPIRES_IN: '7d', // 7 days
    ALGORITHM: 'HS256' as const,
    TYPE: 'refresh' as const,
  },

  // Cookie Configuration
  COOKIE: {
    REFRESH_TOKEN_NAME: 'refreshToken',
    // No MAX_AGE - persistent cookie (no expiration)
    PATH: '/',
    HTTP_ONLY: true,
    SECURE: false,
    SAME_SITE: 'lax' as const,
  },

  // Session Configuration
  SESSION: {
    MAX_ACTIVE_SESSIONS: 5, // Maximum active sessions per user
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // Password Configuration
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_SPECIAL_CHARS: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
  },

  // Rate Limiting Configuration
  RATE_LIMIT: {
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
    REFRESH_ATTEMPTS: {
      MAX_ATTEMPTS: 10,
      WINDOW_MS: 60 * 1000, // 1 minute
    },
  },

  // OTP Configuration
  OTP: {
    LENGTH: 6,
    MIN_VALUE: 100000,
    MAX_VALUE: 999999,
    EXPIRES_IN_MS: 1 * 60 * 1000, // 1 minute in milliseconds
    EXPIRES_IN_MINUTES: 1,
  },

  // Security Configuration
  SECURITY: {
    BCRYPT_ROUNDS: 12,
    JWT_ISSUER: 'stockpro-platform',
    JWT_AUDIENCE: 'stockpro-platform-users',
  },
} as const;

// Type definitions for better TypeScript support
export type TokenType =
  | typeof TOKEN_CONSTANTS.ACCESS_TOKEN.TYPE
  | typeof TOKEN_CONSTANTS.REFRESH_TOKEN.TYPE;
export type TokenAlgorithm = typeof TOKEN_CONSTANTS.ACCESS_TOKEN.ALGORITHM;
export type SameSitePolicy = typeof TOKEN_CONSTANTS.COOKIE.SAME_SITE;
