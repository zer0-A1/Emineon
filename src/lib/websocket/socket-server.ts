// PRISMA_REMOVED: This file needs to be updated to use new database queries
import { db } from '@/lib/db/queries';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

// Database queries handled through db import

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as { userId: string; role: string };

        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        next();
      } catch (error) {
        next(new Error('Invalid authentication'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);

      // Track user connections
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)?.add(socket.id);
      }

      // Join user-specific room
      socket.join(`user:${socket.userId}`);

      // Handle job subscriptions
      socket.on('subscribe:job', (jobId: string) => {
        socket.join(`job:${jobId}`);
        console.log(`User ${socket.userId} subscribed to job ${jobId}`);
      });

      socket.on('unsubscribe:job', (jobId: string) => {
        socket.leave(`job:${jobId}`);
        console.log(`User ${socket.userId} unsubscribed from job ${jobId}`);
      });

      // Handle project subscriptions
      socket.on('subscribe:project', (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on('unsubscribe:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      // Handle candidate pipeline updates
      socket.on('candidate:move', async (data: {
        applicationId: string;
        jobId: string;
        newStage: string;
        candidateId: string;
      }) => {
        try {
          // Update in database
          const application = await db.application.update({
            where: { id: data.applicationId },
            data: { 
              stage: data.newStage,
              updatedAt: new Date()
            },
            include: {
              candidate: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          });

          // Emit to all users watching this job
          this.io.to(`job:${data.jobId}`).emit('pipeline:updated', {
            applicationId: data.applicationId,
            candidateId: data.candidateId,
            newStage: data.newStage,
            candidate: application.candidate,
            updatedBy: socket.userId,
            timestamp: new Date(),
          });

          // Log activity
          const job = await db.job.findUnique({
            where: { id: data.jobId },
            select: { projectId: true }
          });

          if (job) {
            await db.projectActivity.create({
              data: {
                projectId: job.projectId,
                type: 'CANDIDATE_STAGE_CHANGED',
                description: `Candidate moved to ${data.newStage}`,
                metadata: {
                  applicationId: data.applicationId,
                  candidateId: data.candidateId,
                  jobId: data.jobId,
                  newStage: data.newStage,
                  updatedBy: socket.userId,
                },
              }
            });
          }
        } catch (error) {
          socket.emit('error', {
            message: 'Failed to move candidate',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Handle candidate addition
      socket.on('candidate:add', async (data: {
        jobId: string;
        candidateId: string;
        stage?: string;
      }) => {
        try {
          // Create application
          const application = await db.application.create({
            data: {
              jobId: data.jobId,
              candidateId: data.candidateId,
              stage: data.stage || 'sourced',
              status: 'PENDING',
            },
            include: {
              candidate: true,
            }
          });

          // Emit to all users watching this job
          this.io.to(`job:${data.jobId}`).emit('candidate:added', {
            application,
            addedBy: socket.userId,
            timestamp: new Date(),
          });
        } catch (error) {
          socket.emit('error', {
            message: 'Failed to add candidate',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Handle job updates
      socket.on('job:update', async (data: {
        jobId: string;
        updates: any;
      }) => {
        try {
          const job = await db.job.update({
            where: { id: data.jobId },
            data: data.updates,
          });

          // Emit to all users watching this job
          this.io.to(`job:${data.jobId}`).emit('job:updated', {
            job,
            updatedBy: socket.userId,
            timestamp: new Date(),
          });

          // Also emit to project subscribers
          if (job.projectId) {
            this.io.to(`project:${job.projectId}`).emit('project:job:updated', {
              jobId: job.id,
              updates: data.updates,
            });
          }
        } catch (error) {
          socket.emit('error', {
            message: 'Failed to update job',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Handle real-time notifications
      socket.on('notification:send', async (data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        metadata?: any;
      }) => {
        // Send to specific user
        this.io.to(`user:${data.userId}`).emit('notification:received', {
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
          timestamp: new Date(),
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        
        // Remove from user sockets tracking
        if (socket.userId) {
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  // Utility methods for server-side emissions
  public emitToJob(jobId: string, event: string, data: any) {
    this.io.to(`job:${jobId}`).emit(event, data);
  }

  public emitToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Get active connections info
  public getActiveConnections() {
    const connections: { userId: string; socketCount: number }[] = [];
    
    this.userSockets.forEach((sockets, userId) => {
      connections.push({
        userId,
        socketCount: sockets.size,
      });
    });

    return {
      totalUsers: this.userSockets.size,
      connections,
    };
  }
}

// Singleton instance
let socketServer: WebSocketServer | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketServer {
  if (!socketServer) {
    socketServer = new WebSocketServer(server);
  }
  return socketServer;
}

export function getWebSocketServer(): WebSocketServer | null {
  return socketServer;
}
