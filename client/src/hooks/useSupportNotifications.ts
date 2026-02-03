import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';

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

export function useSupportNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    // Check if user is logged in by checking for access token
    const token = localStorage.getItem('accessToken');
    if (!token || !user) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get<{ success: boolean; data: any }>('/me/support-notifications/count', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
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

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    refreshCount: fetchUnreadCount,
  };
}
