/**
 * Authentication utilities for environment-based auth handling
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

interface AuthResult {
  userId: string | null;
  isAuthenticated: boolean;
  response?: NextResponse;
}

/**
 * Handle authentication with environment-based bypass
 * In development: bypasses auth for API testing
 * In production: enforces authentication
 */
export async function handleAuth(): Promise<AuthResult> {
  // Env-flag bypass for local testing or CI
  if (process.env.BYPASS_CLERK === 'true' || process.env.SKIP_AUTH_CHECK === 'true') {
    console.log('🔓 Development mode: bypassing authentication');
    return {
      userId: 'dev-user',
      isAuthenticated: true
    };
  }

  // In production, enforce authentication
  const { userId } = auth();
  
  if (!userId) {
    return {
      userId: null,
      isAuthenticated: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in to access this resource'
        },
        { status: 401 }
      )
    };
  }

  return {
    userId,
    isAuthenticated: true
  };
}

/**
 * Middleware helper for auth checking
 */
export function requireAuth() {
  return handleAuth();
}
