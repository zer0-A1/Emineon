'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Send error to monitoring service (Sentry, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg mx-auto">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    Technical Details (Development)
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.resetError}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('🚨 Error caught by useErrorHandler:', error, errorInfo);
    
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  };
} 