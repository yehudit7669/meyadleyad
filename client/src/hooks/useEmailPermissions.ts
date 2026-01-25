import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface EmailPermission {
  id: number;
  email: string;
  permissionType: string;
  scope: 'one-time' | 'temporary' | 'permanent';
  expiry: string | null;
  adminNote: string;
  createdAt: string;
  createdBy: string;
  usedAt: string | null;
  isActive: boolean;
}

export function useEmailPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<EmailPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.email) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get<EmailPermission[]>(`${API_URL}/admin/email-permissions/my-permissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Response already filtered for current user
        setPermissions(response.data.filter((p: EmailPermission) => p.isActive));
      } catch (error) {
        console.error('Failed to fetch email permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.email]);

  const hasPermission = (permissionType: string): boolean => {
    if (!user?.email) return false;

    // Check role-based permissions first
    if (user.role === 'SUPER_ADMIN') return true;
    
    if (user.role === 'ADMIN') {
      // Admins have all permissions
      return true;
    }

    // Check email-based exceptional permissions
    const now = new Date();
    return permissions.some((p) => {
      if (p.permissionType !== permissionType) return false;
      if (!p.isActive) return false;
      if (p.scope === 'one-time' && p.usedAt) return false;
      if (p.expiry && new Date(p.expiry) < now) return false;
      return true;
    });
  };

  return {
    permissions,
    loading,
    hasPermission,
  };
}
