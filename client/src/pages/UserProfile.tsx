import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/api';
import { Link } from 'react-router-dom';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: authService.getCurrentUser,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setIsEditing(false);
    },
  });

  const handleEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">לא נמצאו נתוני משתמש</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">הפרופיל שלי</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* פרטים אישיים */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">פרטים אישיים</h2>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  aria-label="ערוך פרופיל"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  ערוך
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    aria-label="שמור שינויים"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    aria-label="בטל עריכה"
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">
                    {user.name || 'לא הוזן'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-gray-900">
                    {user.email || 'לא זמין'}
                  </div>
                  {user.emailVerified ? (
                    <span className="text-green-600 text-sm">✓ מאומת</span>
                  ) : (
                    <span className="text-red-600 text-sm">לא מאומת</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">
                    {user.phone || 'לא הוזן'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך הצטרפות
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('he-IL') : 'לא זמין'}
                </div>
              </div>
            </div>
          </div>

          {/* תפריט צד */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4">ניהול חשבון</h3>
              <div className="space-y-2">
                <Link
                  to="/profile/ads"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  📋 המודעות שלי
                </Link>
                <Link
                  to="/ads/new"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  ➕ פרסם מודעה
                </Link>
                <button className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                  🚪 התנתק
                </button>
              </div>
            </div>

            {user?.isAdmin && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4 text-purple-800">ניהול מערכת</h3>
                <Link
                  to="/admin"
                  className="block px-4 py-2 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition"
                >
                  🛠️ פאנל ניהול
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
