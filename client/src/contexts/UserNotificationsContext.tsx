import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export interface SupportNotification {
  id: string;
  conversationId: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  conversation: {
    lastMessagePreview?: string;
  };
}

interface UserNotificationsContextType {
  notifications: SupportNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

const UserNotificationsContext = createContext<UserNotificationsContextType | undefined>(undefined);

export function UserNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    // Check if user is logged in by checking for access token
    const token = localStorage.getItem('accessToken');
    if (!token || !user) {
      console.log('[User Notifications] No token or user, setting count to 0');
      setUnreadCount(0);
      return;
    }

    try {
      console.log('[User Notifications] Fetching unread count...');
      const response = await api.get<{ success: boolean; data: any }>('/me/support-notifications/count', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('[User Notifications] Response:', response.data);
      if (response.data.success) {
        console.log('[User Notifications] Setting unread count to:', response.data.data.count);
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('[User Notifications] Error fetching count:', error);
      // Silent fail - set to 0 on error
      setUnreadCount(0);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: any }>('/me/support-notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching support notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch when user changes (login/logout)
    if (!user) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
  }, [user]);

  return (
    <UserNotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      fetchNotifications, 
      refreshCount: fetchUnreadCount 
    }}>
      {children}
    </UserNotificationsContext.Provider>
  );
}

export function useUserNotifications() {
  const context = useContext(UserNotificationsContext);
  if (context === undefined) {
    throw new Error('useUserNotifications must be used within UserNotificationsProvider');
  }
  return context;
}
