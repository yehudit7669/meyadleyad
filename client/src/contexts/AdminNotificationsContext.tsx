import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { AuthContext } from '../hooks/useAuth';

interface AdminNotificationsContextType {
  unreadCount: number;
  refetch: () => Promise<void>;
}

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Use AuthContext directly to avoid hook order issues
  const auth = useContext(AuthContext);
  const user = auth?.user || null;

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
  }, [user]);

  return (
    <AdminNotificationsContext.Provider value={{ unreadCount, refetch: fetchUnreadCount }}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within AdminNotificationsProvider');
  }
  return context;
}
