/**
 * Centralized logging utility to replace direct console calls.
 * This ensures logs can be filtered by level and captured properly in production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) console.debug('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // In a real app, this might also send to Sentry or another monitoring service
  }
};
