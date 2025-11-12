'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  Call, 
  Channel, 
  SystemMetrics, 
  DashboardStats, 
  WebSocketMessage,
  Notification 
} from '@/types';
import { useAuth } from './AuthContext';
import apiClient from '@/lib/api-client';

interface WebSocketContextType {
  socket: any | null;
  connected: boolean;
  activeCalls: Call[];
  activeChannels: Channel[];
  systemMetrics: SystemMetrics | null;
  dashboardStats: DashboardStats | null;
  notifications: Notification[];
  connect: () => void;
  disconnect: () => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [activeChannels, setActiveChannels] = useState<Channel[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isAuthenticated, token } = useAuth();

  const connect = () => {
    if (!isAuthenticated || !token) return;

    try {
      const newSocket = apiClient.createWebSocket();
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setSocket(newSocket);
        
        // Request initial data
        newSocket.send(JSON.stringify({
          type: 'subscribe',
          data: {
            events: ['calls', 'channels', 'metrics', 'notifications']
          }
        }));
      };

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (isAuthenticated) {
            connect();
          }
        }, 5000);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'call_update':
        handleCallUpdate(message.data);
        break;
      case 'channel_update':
        handleChannelUpdate(message.data);
        break;
      case 'system_metrics':
        setSystemMetrics(message.data);
        break;
      case 'dashboard_stats':
        setDashboardStats(message.data);
        break;
      case 'notification':
        handleNotification(message.data);
        break;
      case 'initial_data':
        handleInitialData(message.data);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  const handleCallUpdate = (data: Call | Call[]) => {
    if (Array.isArray(data)) {
      setActiveCalls(data);
    } else {
      setActiveCalls(prev => {
        const index = prev.findIndex(call => call.id === data.id);
        if (index >= 0) {
          if (data.status === 'ended') {
            return prev.filter(call => call.id !== data.id);
          } else {
            const newCalls = [...prev];
            newCalls[index] = data;
            return newCalls;
          }
        } else {
          return [...prev, data];
        }
      });
    }
  };

  const handleChannelUpdate = (data: Channel | Channel[]) => {
    if (Array.isArray(data)) {
      setActiveChannels(data);
    } else {
      setActiveChannels(prev => {
        const index = prev.findIndex(channel => channel.id === data.id);
        if (index >= 0) {
          if (data.state === 'down') {
            return prev.filter(channel => channel.id !== data.id);
          } else {
            const newChannels = [...prev];
            newChannels[index] = data;
            return newChannels;
          }
        } else {
          return [...prev, data];
        }
      });
    }
  };

  const handleNotification = (data: Notification) => {
    setNotifications(prev => [data, ...prev.slice(0, 49)]); // Keep only last 50 notifications
  };

  const handleInitialData = (data: any) => {
    if (data.calls) setActiveCalls(data.calls);
    if (data.channels) setActiveChannels(data.channels);
    if (data.metrics) setSystemMetrics(data.metrics);
    if (data.stats) setDashboardStats(data.stats);
    if (data.notifications) setNotifications(data.notifications);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    socket,
    connected,
    activeCalls,
    activeChannels,
    systemMetrics,
    dashboardStats,
    notifications,
    connect,
    disconnect,
    clearNotifications,
    markNotificationRead,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export default WebSocketProvider;