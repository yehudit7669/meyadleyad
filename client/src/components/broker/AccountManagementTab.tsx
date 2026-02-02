import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCreateExportRequest, useCreateDeleteRequest } from '../../hooks/useBroker';
import { pendingApprovalsService } from '../../services/api';

const AccountManagementTab: React.FC = () => {
  const createExportRequest = useCreateExportRequest();
  const createDeleteRequest = useCreateDeleteRequest();
  const [deleteReason, setDeleteReason] = useState('');
  const [showDeleteForm, setShowDeleteForm] = useState(false);

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

  const handleExportRequest = async () => {
    if (confirm('האם אתה בטוח שברצונך לבקש ייצוא של כל הנתונים שלך?')) {
      await createExportRequest.mutateAsync();
    }
  };

  const handleDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('האם אתה בטוח לחלוטין? פעולה זו בלתי הפיכה לאחר אישור מנהל.')) {
      await createDeleteRequest.mutateAsync(deleteReason);
      setShowDeleteForm(false);
      setDeleteReason('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ניהול חשבון</h2>

      {/* Export Data */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">ייצוא נתונים</h3>
        <p className="text-gray-700 mb-4">
          בקש ייצוא של כל הנתונים האישיים שלך במערכת. הבקשה תטופל על ידי מנהל והקובץ יישלח אליך במייל.
        </p>
        <button
          onClick={handleExportRequest}
          disabled={createExportRequest.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {createExportRequest.isPending ? 'שולח בקשה...' : 'בקש ייצוא נתונים'}
        </button>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
        <h3 className="font-semibold text-lg mb-2 text-red-900">מחיקת חשבון</h3>
        <p className="text-gray-700 mb-4">
          בקש מחיקה מלאה של החשבון שלך מהמערכת. הפעולה תבוצע רק לאחר אישור מנהל ובהתאם לתקנות GDPR.
          <br />
          <strong className="text-red-700">שים לב:</strong> פעולה זו בלתי הפיכה ותמחק את כל המודעות, הפגישות והנתונים שלך.
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
        
        {!showDeleteForm ? (
          <button
            onClick={() => setShowDeleteForm(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            בקש מחיקת חשבון
          </button>
        ) : (
          <form onSubmit={handleDeleteRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיבת המחיקה (אופציונלי)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="נשמח לדעת מדוע אתה מבקש למחוק את החשבון..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createDeleteRequest.isPending}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {createDeleteRequest.isPending ? 'שולח בקשה...' : 'אשר מחיקה'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteForm(false);
                  setDeleteReason('');
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountManagementTab;
