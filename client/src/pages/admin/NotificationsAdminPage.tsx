import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface NotificationSettings {
  id: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RetryResponse {
  message: string;
  count: number;
}

export default function NotificationsAdminPage() {
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState('');
  const [overrideMode, setOverrideMode] = useState<'ALLOW' | 'BLOCK'>('ALLOW');
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');

  // Get global settings
  const { data: globalSettings, isLoading: loadingSettings } = useQuery<NotificationSettings>({
    queryKey: ['notifications', 'settings'],
    queryFn: async (): Promise<NotificationSettings> => {
      const res = await axios.get(`${API_URL}/notifications/admin/settings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return res.data as NotificationSettings;
    },
  });

  // Update global settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await axios.put(
        `${API_URL}/notifications/admin/settings`,
        { enabled },
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'settings'] });
    },
  });

  // Set user override
  const setOverrideMutation = useMutation({
    mutationFn: async (data: { email: string; mode: 'ALLOW' | 'BLOCK'; expiresAt: string; reason?: string }) => {
      const res = await axios.post(
        `${API_URL}/notifications/admin/override`,
        { email: data.email, mode: data.mode, expiresAt: data.expiresAt, reason: data.reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedEmail('');
      setReason('');
      setExpiresAt('');
    },
  });

  // Retry failed notifications
  const retryFailedMutation = useMutation<RetryResponse>({
    mutationFn: async (): Promise<RetryResponse> => {
      const res = await axios.post(
        `${API_URL}/notifications/admin/retry-failed`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      return res.data as RetryResponse;
    },
  });

  const handleSubmitOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !expiresAt) {
      alert('נא למלא את כל השדות הנדרשים');
      return;
    }
    setOverrideMutation.mutate({
      email: selectedEmail,
      mode: overrideMode,
      expiresAt,
      reason,
    });
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">ניהול התראות על נכסים חדשים</h1>

      {/* Global Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">הגדרות גלובליות</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={globalSettings?.enabled || false}
              onChange={(e) => updateSettingsMutation.mutate(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="text-lg text-gray-900">
              {globalSettings?.enabled ? '✅ התראות מופעלות לכל המשתמשים' : '❌ התראות מושבתות לכל המשתמשים'}
            </span>
          </label>
        </div>
        <p className="text-sm text-gray-700 mt-2">
          כאשר מושבת - רק משתמשים עם חריגה "ALLOW" יקבלו התראות<br />
          כאשר מופעל - כל המשתמשים יקבלו התראות, חוץ מאלו עם חריגה "BLOCK"
        </p>
      </div>

      {/* User Overrides */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">חריגות למשתמש ספציפי</h2>
        <form onSubmit={handleSubmitOverride} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              כתובת אימייל
            </label>
            <input
              type="email"
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="הזן כתובת אימייל"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              סוג חריגה
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="ALLOW"
                  checked={overrideMode === 'ALLOW'}
                  onChange={() => setOverrideMode('ALLOW')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900">ALLOW - אפשר גם כשהגלובלי כבוי</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="BLOCK"
                  checked={overrideMode === 'BLOCK'}
                  onChange={() => setOverrideMode('BLOCK')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-900">BLOCK - חסום גם כשהגלובלי דולק</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              תאריך תפוגה
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              סיבה (אופציונלי)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="הסבר קצר לחריגה..."
            />
          </div>

          <button
            type="submit"
            disabled={setOverrideMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {setOverrideMutation.isPending ? 'שומר...' : 'הגדר חריגה'}
          </button>

          {setOverrideMutation.isSuccess && (
            <div className="text-green-600">✓ החריגה נשמרה בהצלחה!</div>
          )}
          {setOverrideMutation.isError && (
            <div className="text-red-600">✗ שגיאה בשמירת החריגה</div>
          )}
        </form>
      </div>

      {/* Retry Failed */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">התראות שנכשלו</h2>
        <p className="text-sm text-gray-600 mb-4">
          נסה שוב לשלוח התראות שנכשלו בשליחה הקודמת
        </p>
        <button
          onClick={() => retryFailedMutation.mutate()}
          disabled={retryFailedMutation.isPending}
          className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {retryFailedMutation.isPending ? 'מנסה שוב...' : 'נסה שוב לשלוח התראות שנכשלו'}
        </button>

        {retryFailedMutation.isSuccess && (
          <div className="mt-3 text-green-600">
            ✓ {retryFailedMutation.data.message}
          </div>
        )}
        {retryFailedMutation.isError && (
          <div className="mt-3 text-red-600">
            ✗ שגיאה בניסיון החוזר
          </div>
        )}
      </div>
    </div>
  );
}
