import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersAdminService } from '../../services/users-admin.service';
import { useAuth } from '../../hooks/useAuth';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [meetingsBlock, setMeetingsBlock] = useState({
    blocked: false,
    reason: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);
  const [bulkRemoveReason, setBulkRemoveReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Permissions
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;
  const isModerator = currentUser?.role === 'MODERATOR';

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-user-profile', userId],
    queryFn: () => usersAdminService.getUserProfile(userId!),
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersAdminService.updateUser(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-profile', userId] });
      setEditMode(false);
      alert('פרטי המשתמש עודכנו בהצלחה');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בעדכון משתמש');
    },
  });

  const meetingsBlockMutation = useMutation({
    mutationFn: () => 
      usersAdminService.setMeetingsBlock(userId!, meetingsBlock.blocked, meetingsBlock.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-profile', userId] });
      alert(meetingsBlock.blocked ? 'תיאום פגישות נחסם' : 'חסימת תיאום פגישות בוטלה');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בעדכון חסימת פגישות');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersAdminService.deleteUser(userId!),
    onSuccess: () => {
      alert('המשתמש נמחק בהצלחה');
      navigate('/admin/users');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה במחיקת משתמש');
    },
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: (reason: string) => usersAdminService.bulkRemoveUserAds(userId!, reason),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-profile', userId] });
      setShowBulkRemoveConfirm(false);
      setBulkRemoveReason('');
      alert(`הוסרו ${response.data.removedCount} מודעות בהצלחה`);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בהסרת מודעות');
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">טוען...</div></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-lg text-red-600">שגיאה בטעינת פרופיל</div></div>;
  }

  const profile = data?.data;

  if (!profile) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">משתמש לא נמצא</div></div>;
  }

  const handleEdit = () => {
    setFormData({
      name: profile.name,
      phone: profile.phone || '',
      status: profile.status,
      roleType: profile.role,
      weeklyDigestOptIn: profile.weeklyDigestOptIn,
      notifyNewMatches: profile.notifyNewMatches || false,
    });
    setEditMode(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleMeetingsBlockToggle = () => {
    setMeetingsBlock({
      blocked: !profile.meetingsBlocked,
      reason: '',
    });
  };

  const handleMeetingsBlockSave = () => {
    meetingsBlockMutation.mutate();
  };

  const handleDelete = () => {
    if (deleteConfirmText !== profile.email) {
      alert('יש להקליד את כתובת האימייל של המשתמש לאישור המחיקה');
      return;
    }
    deleteMutation.mutate();
  };

  const handleBulkRemove = () => {
    if (!bulkRemoveReason.trim()) {
      alert('חובה להזין סיבה להסרת המודעות');
      return;
    }
    bulkRemoveMutation.mutate(bulkRemoveReason);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/admin/users" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← חזרה לרשימת משתמשים
        </Link>
        <h1 className="text-3xl font-bold text-black">פרופיל משתמש</h1>
      </div>

      {/* Profile Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">פרטי משתמש</h2>
        
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">שם מלא</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">טלפון</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-black mb-1">סוג משתמש</label>
                <select
                  value={formData.roleType}
                  onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">משתמש פרטי</option>
                  <option value="BROKER">מתווך</option>
                  <option value="SERVICE_PROVIDER">נותן שירות</option>
                  <option value="ADMIN">מנהל</option>
                  <option value="SUPER_ADMIN">מנהל על</option>
                  <option value="MODERATOR">מנהל צופה</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black mb-1">סטטוס חשבון</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">פעיל</option>
                <option value="PARTIAL_BLOCK">חסום חלקית</option>
                <option value="BLOCKED">חסום</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="weeklyDigest"
                checked={formData.weeklyDigestOptIn}
                onChange={(e) => setFormData({ ...formData, weeklyDigestOptIn: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="weeklyDigest" className="mr-2 block text-sm text-black">
                קבלת תוכן שבועי במייל
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-6 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-black font-medium">שם מלא:</span>
              <p className="font-medium text-black">{profile.name}</p>
            </div>
            {!isModerator && (
              <div>
                <span className="text-sm text-black font-medium">אימייל:</span>
                <p className="font-medium text-black">{profile.email}</p>
              </div>
            )}
            {!isModerator && (
              <div>
                <span className="text-sm text-black font-medium">טלפון:</span>
                <p className="font-medium text-black">{profile.phone || 'לא צוין'}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-black font-medium">סוג משתמש:</span>
              <p className="font-medium text-black">{profile.role}</p>
            </div>
            <div>
              <span className="text-sm text-black font-medium">סטטוס:</span>
              <p className="font-medium text-black">{profile.status}</p>
            </div>
            <div>
              <span className="text-sm text-black font-medium">תאריך הרשמה:</span>
              <p className="font-medium text-black">{new Date(profile.createdAt).toLocaleDateString('he-IL')}</p>
            </div>
            <div>
              <span className="text-sm text-black font-medium">כמות מודעות:</span>
              <p className="font-medium text-black">{profile.adsCount}</p>
            </div>
            <div>
              <span className="text-sm text-black font-medium">קבלת תוכן במייל:</span>
              <p className="font-medium text-black">{profile.weeklyDigestOptIn ? 'כן' : 'לא'}</p>
            </div>

            {isAdmin && (
              <div className="col-span-2 pt-4 border-t">
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ערוך פרטים
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meetings Block */}
      {isAdmin && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">חסימת תיאום פגישות</h2>
          
          <div className="flex items-start gap-4 mb-4">
            <input
              type="checkbox"
              id="meetingsBlocked"
              checked={meetingsBlock.blocked}
              onChange={handleMeetingsBlockToggle}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="meetingsBlocked" className="block text-sm text-black">
              מנע מהמשתמש לבקש או לקבל פגישות להצגת נכסים
            </label>
          </div>

          {meetingsBlock.blocked && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">סיבה (אופציונלי)</label>
              <textarea
                value={meetingsBlock.reason}
                onChange={(e) => setMeetingsBlock({ ...meetingsBlock, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="סיבת החסימה..."
              />
            </div>
          )}

          {profile.meetingsBlocked && profile.meetingsBlockReason && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>סיבת חסימה נוכחית:</strong> {profile.meetingsBlockReason}
              </p>
              {profile.meetingsBlockedAt && (
                <p className="text-xs text-yellow-700 mt-1">
                  נחסם ב: {new Date(profile.meetingsBlockedAt).toLocaleString('he-IL')}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleMeetingsBlockSave}
            disabled={meetingsBlockMutation.isPending}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {meetingsBlockMutation.isPending ? 'שומר...' : 'שמור שינוי'}
          </button>
        </div>
      )}

      {/* Ads List */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-black mb-4">מודעות של המשתמש ({profile.adsCount})</h2>
        
        {profile.ads && profile.ads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">כתובת</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">צפיות</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profile.ads.map((ad: any) => (
                  <tr key={ad.id}>
                    <td className="px-6 py-4 text-sm text-black">{ad.address}</td>
                    <td className="px-6 py-4 text-sm text-black">
                      {new Date(ad.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">{ad.status}</td>
                    <td className="px-6 py-4 text-sm text-black">{ad.viewsCount}</td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={ad.previewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        צפה
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-black">אין מודעות</p>
        )}
      </div>

      {/* Audit History (Not visible to Moderators) */}
      {!isModerator && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-black mb-4">היסטוריית פעולות ניהוליות (10 אחרונים)</h2>
          
          {profile.auditHistory && profile.auditHistory.length > 0 ? (
            <div className="space-y-2">
              {profile.auditHistory.map((log: any) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-black">{log.action}</span>
                    <span className="text-xs text-black">
                      {new Date(log.createdAt).toLocaleString('he-IL')}
                    </span>
                  </div>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <pre className="text-xs text-black mt-2 overflow-x-auto">
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-black">אין היסטוריית פעולות</p>
          )}
        </div>
      )}

      {/* Dangerous Actions (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-red-50 border border-red-200 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">פעולות מסוכנות</h2>
          
          {/* Bulk Remove Ads */}
          <div className="mb-6">
            <h3 className="font-medium text-red-700 mb-2">הסרת כל מודעות המשתמש</h3>
            {!showBulkRemoveConfirm ? (
              <button
                onClick={() => setShowBulkRemoveConfirm(true)}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                🗑️ הסר את כל המודעות
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">סיבת ההסרה (חובה)</label>
                  <textarea
                    value={bulkRemoveReason}
                    onChange={(e) => setBulkRemoveReason(e.target.value)}
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="הזן סיבה להסרת כל המודעות..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleBulkRemove}
                    disabled={bulkRemoveMutation.isPending || !bulkRemoveReason.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {bulkRemoveMutation.isPending ? 'מסיר...' : 'אשר הסרה'}
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkRemoveConfirm(false);
                      setBulkRemoveReason('');
                    }}
                    className="px-6 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hard Delete User */}
          <div>
            <h3 className="font-medium text-red-700 mb-2">מחיקת משתמש לצמיתות</h3>
            <p className="text-sm text-red-600 mb-4">פעולה זו בלתי הפיכה ותמחק את כל נתוני המשתמש</p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
              >
                מחק משתמש לצמיתות
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-red-700">
                  הקלד את כתובת האימייל של המשתמש לאישור המחיקה: <strong>{profile.email}</strong>
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder={profile.email}
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending || deleteConfirmText !== profile.email}
                    className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'מוחק...' : 'אשר מחיקה'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-6 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
