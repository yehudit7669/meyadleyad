import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../services/api';

export default function PersonalDetailsTab() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const { data: user, isLoading } = useQuery({
    queryKey: ['personal-details'],
    queryFn: profileService.getPersonalDetails,
  });

  // Set form data when user data is loaded
  if (user && !isEditing && !formData.name && !formData.phone) {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
    });
  }

  const updateMutation = useMutation({
    mutationFn: profileService.updatePersonalDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-details'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-6">פרטים אישיים</h2>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם מלא
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="הזן שם מלא"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {user?.name || 'לא הוזן'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            טלפון
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="05XXXXXXXX"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
              {user?.phone || 'לא הוזן'}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            דוא״ל
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-600 flex items-center gap-2">
            {user?.email}
            <span className="text-xs text-gray-500">(לא ניתן לשינוי)</span>
          </div>
        </div>

        {user?.role === 'BROKER' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם חברה
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-900">
                {user?.companyName || 'לא הוזן'}
              </div>
            </div>

            {user?.brokerLogoApproved && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <span>✓</span>
                  <span className="text-sm font-medium">הלוגו שלך אושר והוא מופיע במודעות</span>
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך הצטרפות
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-600">
            {new Date(user?.createdAt).toLocaleDateString('he-IL')}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ביטול
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ערוך פרטים
            </button>
          )}
        </div>

        {updateMutation.isSuccess && (
          <div className="text-sm text-green-600">
            ✓ הפרטים עודכנו בהצלחה
          </div>
        )}

        {updateMutation.isError && (
          <div className="text-sm text-red-600">
            ✗ שגיאה בעדכון הפרטים. אנא בדוק שהטלפון תקין (05XXXXXXXX)
          </div>
        )}
      </div>
    </div>
  );
}
