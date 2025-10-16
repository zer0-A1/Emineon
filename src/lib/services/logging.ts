// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
export interface LogEntry {
  actor?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
}

export class LoggingService {
  async log(entry: LogEntry): Promise<void> {
    try {
      // Temporarily disabled due to schema mismatch
      console.log('LOG:', entry);
      return;
      
      // await db.log.create({
      //   data: {
      //     actor: entry.actor,
      //     action: entry.action,
      //     resource: entry.resource,
      //     details: entry.details,
      //     level: entry.level || 'INFO',
      //   },
      // });

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        const message = `[${entry.level || 'INFO'}] ${entry.action} on ${entry.resource}`;
        const details = entry.details ? JSON.stringify(entry.details, null, 2) : '';
        
        switch (entry.level) {
          case 'ERROR':
            console.error(message, details);
            break;
          case 'WARN':
            console.warn(message, details);
            break;
          case 'DEBUG':
            console.debug(message, details);
            break;
          default:
            console.log(message, details);
        }
      }
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', error);
      console.log('Original log entry:', entry);
    }
  }

  async getLogs(filters?: {
    actor?: string;
    action?: string;
    resource?: string;
    level?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    // Temporarily disabled due to schema mismatch
    return [];
    
    // const where: any = {};
    
    // if (filters?.actor) where.actor = { contains: filters.actor, mode: 'insensitive' };
    // if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
    // if (filters?.resource) where.resource = { contains: filters.resource, mode: 'insensitive' };
    // if (filters?.level) where.level = filters.level;
    
    // if (filters?.startDate || filters?.endDate) {
    //   where.timestamp = {};
    //   if (filters.startDate) where.timestamp.gte = filters.startDate;
    //   if (filters.endDate) where.timestamp.lte = filters.endDate;
    // }

    // return db.log.findMany({
    //   where,
    //   orderBy: { timestamp: 'desc' },
    //   take: filters?.limit || 100,
    // });
  }

  async getOperationalMetrics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    // Temporarily disabled due to schema mismatch
    return {
      timeframe,
      startDate: new Date(),
      endDate: new Date(),
      summary: { totalLogs: 0, errorLogs: 0, warningLogs: 0, errorRate: 0 },
      topActions: []
    };
    
    /*
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [totalLogs, errorLogs, warningLogs, actionCounts] = await Promise.all([
      // Total logs count
      db.log.count({
        where: { timestamp: { gte: startDate } },
      }),
      
      // Error logs count
      db.log.count({
        where: { 
          timestamp: { gte: startDate },
          level: 'ERROR',
        },
      }),
      
      // Warning logs count
      db.log.count({
        where: { 
          timestamp: { gte: startDate },
          level: 'WARN',
        },
      }),
      
      // Action breakdown
      db.log.groupBy({
        by: ['action'],
        where: { timestamp: { gte: startDate } },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      timeframe,
      startDate,
      endDate: now,
      summary: {
        totalLogs,
        errorLogs,
        warningLogs,
        errorRate: totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0,
      },
      topActions: actionCounts.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
    };
    */
  }

  async logActivity(
    type: string,
    action: string,
    userId: string,
    details: Record<string, unknown> = {}
  ) {
    // ... existing code ...
  }

  async getActivityLogs(
    userId?: string,
    type?: string,
    limit: number = 50
  ) {
    // Remove unused filters variable
    const logs = [
      // Mock data for now
    ];
    
    // ... existing code ...
  }
}

export const loggingService = new LoggingService(); 