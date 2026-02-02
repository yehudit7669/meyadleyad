import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceProviderService, pendingApprovalsService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
  profile: any;
}

const SPAccountManagementTab: React.FC<Props> = ({ profile: _profile }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch user's approval requests
  const { data: myApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: pendingApprovalsService.getMyApprovals,
    refetchInterval: 5000, // רענון כל 5 שניות
  });

  // Find account deletion rejection - get the most recent one
  const getLatestRejection = (type: string) => {
    const rejections = myApprovals?.filter((a: any) => a.type === type && a.status === 'REJECTED') || [];
    if (rejections.length === 0) return null;
    return rejections.sort((a: any, b: any) => 
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    )[0];
  };

  const deleteRejection = getLatestRejection('ACCOUNT_DELETION');
  const deletePending = myApprovals?.find((a: any) => a.type === 'ACCOUNT_DELETION' && a.status === 'PENDING');
  const deleteApproved = myApprovals?.find((a: any) => a.type === 'ACCOUNT_DELETION' && a.status === 'APPROVED');

  const exportMutation = useMutation({
    mutationFn: serviceProviderService.requestDataExport,
    onSuccess: () => {
      toast.success('בקשת ייצוא נתונים נשלחה בהצלחה');
      setShowExportModal(false);
    },
    onError: () => {
      toast.error('שגיאה בשליחת בקשת ייצוא');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reason: string) => pendingApprovalsService.create({
      type: 'ACCOUNT_DELETION',
      requestData: {
        reason: reason,
        requestedAt: new Date().toISOString(),
      },
      reason: reason || 'בקשת הסרת חשבון',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('בקשת מחיקת חשבון נשלחה ומחכה לאישור מנהל');
      setShowDeleteModal(false);
      setDeleteReason('');
    },
    onError: () => {
      toast.error('שגיאה בשליחת בקשת מחיקה');
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate(deleteReason);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ניהול חשבון (GDPR)</h2>

      <div className="space-y-4">
        {/* Data Export */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ייצוא נתונים</h3>
          <p className="text-sm text-gray-600 mb-4">
            בקש ייצוא של כל הנתונים האישיים שלך מהמערכת. הנתונים יישלחו אליך במייל לאחר עיבוד הבקשה.
          </p>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            בקש ייצוא נתונים
          </button>
        </div>

        {/* Account Deletion */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-2">מחיקת חשבון</h3>
          <p className="text-sm text-red-700 mb-4">
            בקש מחיקת החשבון והנתונים שלך מהמערכת. פעולה זו דורשת אישור מנהל ואינה הפיכה.
          </p>
          
          {deleteRejection && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">❌ בקשת המחיקה נדחתה</p>
              {deleteRejection.adminNotes && (
                <p className="text-sm text-red-700">הערת מנהל: {deleteRejection.adminNotes}</p>
              )}
            </div>
          )}
          
          {deleteApproved && !deletePending && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">✅ בקשת מחיקת החשבון אושרה</p>
              {deleteApproved.adminNotes && (
                <p className="text-sm text-green-700">הערת מנהל: {deleteApproved.adminNotes}</p>
              )}
              <p className="text-xs text-green-600 mt-1">החשבון יימחק בקרוב</p>
            </div>
          )}
          
          {deletePending && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-300 rounded-lg">
              <p className="text-sm font-semibold text-orange-800">⏳ בקשת מחיקת חשבון ממתינה לאישור מנהל</p>
              {deletePending.reason && (
                <p className="text-sm text-orange-700 mt-1">סיבה: {deletePending.reason}</p>
              )}
            </div>
          )}
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            בקש הסרת חשבון
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">אישור ייצוא נתונים</h3>
            <p className="text-gray-700 mb-6">
              האם אתה בטוח שברצונך לבקש ייצוא של כל הנתונים האישיים שלך? הנתונים יישלחו אליך במייל לאחר עיבוד הבקשה.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {exportMutation.isPending ? 'שולח...' : 'אישור'}
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4">אישור מחיקת חשבון</h3>
            <p className="text-gray-700 mb-4">
              האם אתה בטוח שברצונך למחוק את החשבון שלך? פעולה זו דורשת אישור מנהל ואינה הפיכה.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיבת המחיקה (אופציונלי)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="ספר לנו למה אתה רוצה למחוק את החשבון..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'שולח...' : 'אישור מחיקה'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SPAccountManagementTab;
