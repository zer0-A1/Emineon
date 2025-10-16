import { useEffect, useRef, useCallback, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  // Event listener storage
  const eventListenersRef = useRef<Map<string, Set<Function>>>(new Map());

  // Initialize socket connection
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts,
        reconnectionDelay,
      });

      // Connection event handlers
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setState({
          connected: true,
          connecting: false,
          error: null,
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setState(prev => ({
          ...prev,
          connected: false,
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setState({
          connected: false,
          connecting: false,
          error: error.message,
        });
      });

      // Re-attach existing event listeners
      eventListenersRef.current.forEach((listeners, event) => {
        listeners.forEach(listener => {
          socket.on(event, listener as any);
        });
      });

      socketRef.current = socket;
    } catch (error) {
      setState({
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  }, [getToken, reconnectionAttempts, reconnectionDelay]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        connected: false,
        connecting: false,
        error: null,
      });
    }
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected. Unable to emit:', event);
    }
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, callback: Function) => {
    // Store listener
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)?.add(callback);

    // Attach to socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, callback as any);
    }

    // Return unsubscribe function
    return () => {
      eventListenersRef.current.get(event)?.delete(callback);
      if (socketRef.current) {
        socketRef.current.off(event, callback as any);
      }
    };
  }, []);

  // Subscribe to event (once)
  const once = useCallback((event: string, callback: Function) => {
    const wrappedCallback = (...args: any[]) => {
      callback(...args);
      eventListenersRef.current.get(event)?.delete(wrappedCallback);
    };

    return on(event, wrappedCallback);
  }, [on]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // State
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    
    // Methods
    connect,
    disconnect,
    emit,
    on,
    once,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current,
  };
}

// Specialized hooks for specific features

export function useJobSocket(jobId: string | undefined) {
  const socket = useWebSocket();
  
  useEffect(() => {
    if (!jobId || !socket.connected) return;

    // Subscribe to job updates
    socket.emit('subscribe:job', jobId);

    // Cleanup
    return () => {
      socket.emit('unsubscribe:job', jobId);
    };
  }, [jobId, socket.connected, socket]);

  return socket;
}

export function useProjectSocket(projectId: string | undefined) {
  const socket = useWebSocket();
  
  useEffect(() => {
    if (!projectId || !socket.connected) return;

    // Subscribe to project updates
    socket.emit('subscribe:project', projectId);

    // Cleanup
    return () => {
      socket.emit('unsubscribe:project', projectId);
    };
  }, [projectId, socket.connected, socket]);

  return socket;
}

export function useNotificationSocket(onNotification: (notification: any) => void) {
  const socket = useWebSocket();
  
  useEffect(() => {
    if (!socket.connected) return;

    // Listen for notifications
    const unsubscribe = socket.on('notification:received', onNotification);

    return unsubscribe;
  }, [socket, onNotification]);

  return socket;
}
