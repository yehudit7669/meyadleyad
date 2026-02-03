import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './useAuth';

export function useAdminSupportNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    try {
      // Only fetch if user is logged in and is admin
      const token = localStorage.getItem('accessToken');
      if (!token || !user?.isAdmin) {
        console.log('[Admin Notifications] No token or not admin, setting count to 0');
        setUnreadCount(0);
        return;
      }

      console.log('[Admin Notifications] Fetching unread count...');
      const response = await api.get<{ success: boolean; data: { count: number } }>('/admin/conversations/unread-count', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('[Admin Notifications] Response:', response.data);
      if (response.data.success) {
        console.log('[Admin Notifications] Setting unread count to:', response.data.data.count);
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('[Admin Notifications] Error fetching count:', error);
      // Silently fail - user might not be admin or not logged in
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    // Only fetch once if user is admin
    if (!user?.isAdmin) {
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
  }, [user]); // Changed from user?.isAdmin to user - need to re-fetch when user object changes

  return { unreadCount, refetch: fetchUnreadCount };
}
