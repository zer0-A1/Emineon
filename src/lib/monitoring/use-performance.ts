'use client';

import { useEffect } from 'react';
import { performanceMonitor } from './performance';

// React hook for performance monitoring
export function usePerformance(componentName: string) {
  useEffect(() => {
    performanceMonitor.startOperation(`component:${componentName}:mount`);
    
    return () => {
      performanceMonitor.endOperation(`component:${componentName}:mount`);
    };
  }, [componentName]);

  return {
    measureOperation: (operationName: string, fn: () => Promise<any>) => 
      performanceMonitor.measureAsync(`${componentName}:${operationName}`, fn),
    startOperation: (operationName: string) => 
      performanceMonitor.startOperation(`${componentName}:${operationName}`),
    endOperation: (operationName: string, success?: boolean) =>
      performanceMonitor.endOperation(`${componentName}:${operationName}`, success),
  };
}
