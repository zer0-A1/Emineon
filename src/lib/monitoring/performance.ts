import * as Sentry from '@sentry/nextjs';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private timers: Map<string, number> = new Map();

  private constructor() {
    // Initialize performance monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeWebVitals();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start measuring an operation
  startOperation(operationId: string, metadata?: Record<string, any>): void {
    this.timers.set(operationId, performance.now());
    
    // Start Sentry transaction
    const transaction = Sentry.startTransaction({
      op: operationId,
      name: operationId,
      data: metadata,
    });
    
    Sentry.getCurrentHub().getScope()?.setSpan(transaction);
  }

  // End measuring an operation
  endOperation(operationId: string, success = true, metadata?: Record<string, any>): void {
    const startTime = this.timers.get(operationId);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    this.timers.delete(operationId);

    // Record metric
    const metric: PerformanceMetrics = {
      operation: operationId,
      duration,
      success,
      metadata,
    };

    if (!this.metrics.has(operationId)) {
      this.metrics.set(operationId, []);
    }
    this.metrics.get(operationId)?.push(metric);

    // End Sentry transaction
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
      transaction.setStatus(success ? 'ok' : 'internal_error');
      transaction.finish();
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operationId} took ${duration.toFixed(2)}ms`);
      Sentry.captureMessage(`Slow operation: ${operationId}`, {
        level: 'warning',
        extra: { duration, metadata },
      });
    }
  }

  // Measure async function performance
  async measureAsync<T>(
    operationId: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startOperation(operationId, metadata);
    
    try {
      const result = await fn();
      this.endOperation(operationId, true, metadata);
      return result;
    } catch (error) {
      this.endOperation(operationId, false, { ...metadata, error: String(error) });
      throw error;
    }
  }

  // Get performance statistics
  getStats(operationId?: string): Record<string, any> {
    if (operationId) {
      const metrics = this.metrics.get(operationId) || [];
      return this.calculateStats(metrics);
    }

    const allStats: Record<string, any> = {};
    this.metrics.forEach((metrics, op) => {
      allStats[op] = this.calculateStats(metrics);
    });
    return allStats;
  }

  private calculateStats(metrics: PerformanceMetrics[]): Record<string, any> {
    if (metrics.length === 0) return {};

    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.success).length;

    return {
      count: metrics.length,
      successRate: (successCount / metrics.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  // Initialize Web Vitals monitoring
  private initializeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Observe Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        Sentry.captureMessage('Web Vitals: LCP', {
          level: 'info',
          extra: { value: entry.startTime },
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Observe First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming;
        const fid = eventEntry.processingStart - eventEntry.startTime;
        Sentry.captureMessage('Web Vitals: FID', {
          level: 'info',
          extra: { value: fid },
        });
      }
    }).observe({ entryTypes: ['first-input'] });

    // Observe Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          Sentry.captureMessage('Web Vitals: CLS', {
            level: 'info',
            extra: { value: clsValue },
          });
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Memory monitoring
  getMemoryUsage(): Record<string, number> | null {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  // Network monitoring
  getNetworkInfo(): Record<string, any> | null {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return null;
    }

    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  // Clear metrics
  clearMetrics(operationId?: string): void {
    if (operationId) {
      this.metrics.delete(operationId);
    } else {
      this.metrics.clear();
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorator for measuring method performance
export function measurePerformance(operationId?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const opId = operationId || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsync(
        opId,
        () => originalMethod.apply(this, args),
        { args: args.length }
      );
    };

    return descriptor;
  };
}

