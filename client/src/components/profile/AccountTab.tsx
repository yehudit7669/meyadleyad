import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { profileService, api } from '../../services/api';

export default function AccountTab() {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: profileService.getPreferences,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: profileService.requestAccountDeletion,
    onSuccess: () => {
      setShowDeleteConfirm(false);
      setDeleteConfirmed(false);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: profileService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  const handleNewsletterToggle = (subscribe: boolean) => {
    updatePreferencesMutation.mutate({ weeklyDigest: subscribe });
  };

  const handleDeleteRequest = () => {
    if (deleteConfirmed) {
      deleteRequestMutation.mutate();
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    if (passwordData.newPassword.length < 6) {
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const isSubscribed = preferences?.weeklyDigest || false;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold mb-6">ניהול חשבון</h2>

      {/* Change Password */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">שינוי סיסמה</h3>
        
        {!showChangePassword ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              רוצה לשנות את הסיסמה שלך?
            </p>
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              שנה סיסמה
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה נוכחית
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה חדשה (לפחות 6 תווים)
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימות סיסמה חדשה
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {passwordData.newPassword && passwordData.confirmPassword && 
             passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="text-sm text-red-600">הסיסמאות אינן תואמות</p>
            )}

            {passwordData.newPassword && passwordData.newPassword.length < 6 && (
              <p className="text-sm text-red-600">הסיסמה חייבת להכיל לפחות 6 תווים</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleChangePassword}
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword ||
                  passwordData.newPassword.length < 6 ||
                  changePasswordMutation.isPending
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? 'שומר...' : 'שמור סיסמה חדשה'}
              </button>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ביטול
              </button>
            </div>

            {changePasswordMutation.isSuccess && (
              <p className="text-sm text-green-600">✓ הסיסמה שונתה בהצלחה</p>
            )}

            {changePasswordMutation.isError && (
              <p className="text-sm text-red-600">
                ✗ {(changePasswordMutation.error as any)?.response?.data?.message || 'שגיאה בשינוי הסיסמה'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Newsletter Subscription */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">רשימת תפוצה</h3>
        <p className="text-sm text-gray-600 mb-4">
          נהל את ההרשמה שלך לקובץ התוכן השבועי
          <br />
          <strong>מצב נוכחי:</strong> {isSubscribed ? 'רשום לרשימת התפוצה' : 'לא רשום לרשימת התפוצה'}
        </p>
        <div className="flex gap-3">
          {!isSubscribed ? (
            <button
              onClick={() => handleNewsletterToggle(true)}
              disabled={updatePreferencesMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {updatePreferencesMutation.isPending ? 'מעדכן...' : 'הוסף אותי לרשימת התפוצה'}
            </button>
          ) : (
            <button
              onClick={() => handleNewsletterToggle(false)}
              disabled={updatePreferencesMutation.isPending}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {updatePreferencesMutation.isPending ? 'מעדכן...' : 'הסר אותי מרשימת התפוצה'}
            </button>
          )}
        </div>
        {updatePreferencesMutation.isSuccess && (
          <div className="mt-3 text-sm text-green-600">
            ✓ ההעדפות עודכנו בהצלחה
          </div>
        )}
        {updatePreferencesMutation.isError && (
          <div className="mt-3 text-sm text-red-600">
            ✗ שגיאה בעדכון ההעדפות
          </div>
        )}
      </div>

      {/* Account Deletion - GDPR */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="font-semibold text-red-900 mb-2">מחיקת חשבון (GDPR)</h3>
        <p className="text-sm text-red-700 mb-4">
          פעולה זו תשלח בקשת מחיקה למנהלי המערכת. הבקשה תיבדק ותטופל בהתאם.
          <br />
          <strong>שים לב:</strong> מחיקת חשבון היא פעולה בלתי הפיכה ותמחק את כל הנתונים שלך.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            בקש מחיקת חשבון
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-red-300 rounded p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded mt-1"
                />
                <span className="text-sm text-gray-900">
                  אני מאשר/ת שקראתי והבנתי שמחיקת החשבון היא בלתי הפיכה ותמחק את כל הנתונים שלי
                  מהמערכת לצמיתות. אני מבקש/ת לשלוח בקשת מחיקה למנהלי המערכת.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteRequest}
                disabled={!deleteConfirmed || deleteRequestMutation.isPending}
                className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50"
              >
                {deleteRequestMutation.isPending ? 'שולח בקשה...' : 'אשר ושלח בקשת מחיקה'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmed(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </div>
        )}

        {deleteRequestMutation.isSuccess && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            ✓ בקשת המחיקה נשלחה בהצלחה. מנהלי המערכת יטפלו בה בהקדם.
          </div>
        )}

        {deleteRequestMutation.isError && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ✗ שגיאה בשליחת הבקשה. אנא נסה שוב מאוחר יותר.
          </div>
        )}
      </div>
    </div>
  );
}
