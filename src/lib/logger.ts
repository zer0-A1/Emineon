/**
 * Centralized logging utility
 * Handles console logging based on environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  // API-specific logging
  api = {
    request: (method: string, path: string, ...args: any[]) => {
      this.debug(`${method} ${path}`, ...args);
    },
    
    response: (method: string, path: string, status: number, ...args: any[]) => {
      if (status >= 400) {
        this.error(`${method} ${path} - ${status}`, ...args);
      } else {
        this.success(`${method} ${path} - ${status}`, ...args);
      }
    },

    auth: (endpoint: string, userId?: string) => {
      if (userId) {
        this.debug(`Auth success for ${endpoint}: ${userId}`);
      } else {
        this.warn(`Auth bypass for ${endpoint} (development mode)`);
      }
    }
  };

  // Database-specific logging
  db = {
    query: (operation: string, table: string, count?: number) => {
      this.debug(`DB ${operation} ${table}${count ? ` (${count} records)` : ''}`);
    },
    
    error: (operation: string, table: string, error: any) => {
      this.error(`DB ${operation} ${table} failed:`, error);
    }
  };

  // Search-specific logging
  search = {
    algolia: (query: string, results: number, time?: number) => {
      this.debug(`Algolia search: "${query}" → ${results} results${time ? ` (${time}ms)` : ''}`);
    },
    
    database: (query: string, results: number) => {
      this.debug(`Database search: "${query}" → ${results} results`);
    }
  };
}

export const logger = new Logger();
