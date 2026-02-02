import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceProviderService, pendingApprovalsService } from '../../services/api';
import { toast } from 'react-hot-toast';

const SPHighlightRequestTab: React.FC = () => {
  const [requestType, setRequestType] = useState<'SERVICE_CARD' | 'BUSINESS_PAGE'>('SERVICE_CARD');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch user's approval requests
  const { data: myApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: pendingApprovalsService.getMyApprovals,
    refetchInterval: 5000, // רענון כל 5 שניות
  });

  // Find highlight rejection and pending - get the most recent one
  const getLatestRejection = (type: string) => {
    const rejections = myApprovals?.filter((a: any) => a.type === type && a.status === 'REJECTED') || [];
    if (rejections.length === 0) return null;
    return rejections.sort((a: any, b: any) => 
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    )[0];
  };

  const highlightRejection = getLatestRejection('HIGHLIGHT_AD');
  const highlightPending = myApprovals?.find((a: any) => a.type === 'HIGHLIGHT_AD' && a.status === 'PENDING');
  const highlightApproved = myApprovals?.find((a: any) => a.type === 'HIGHLIGHT_AD' && a.status === 'APPROVED');

  const requestMutation = useMutation({
    mutationFn: serviceProviderService.requestHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('בקשת הדגשה נשלחה בהצלחה');
      setReason('');
    },
    onError: () => {
      toast.error('שגיאה בשליחת בקשת הדגשה');
    },
  });

  const handleSubmit = () => {
    requestMutation.mutate({ requestType, reason });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">בקשת הדגשה / מודעה מומלצת</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⭐ הדגשת העמוד העסקי שלך תגדיל את החשיפה שלך ותעזור ללקוחות פוטנציאליים למצוא אותך בקלות.
        </p>
      </div>

      <div className="space-y-6">
        
        {highlightApproved && !highlightPending && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ בקשת ההדגשה אושרה!</p>
            {highlightApproved.adminNotes && (
              <p className="text-sm text-green-700">הערת מנהל: {highlightApproved.adminNotes}</p>
            )}
            <p className="text-xs text-green-600 mt-1">המודעה שלך מודגשת כעת באתר</p>
          </div>
        )}
        
        {highlightRejection && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-1">❌ בקשת ההדגשה נדחתה</p>
            {highlightRejection.adminNotes && (
              <p className="text-sm text-red-700">הערת מנהל: {highlightRejection.adminNotes}</p>
            )}
          </div>
        )}
        
        {highlightPending && (
          <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg">
            <p className="text-sm font-semibold text-orange-800">⏳ בקשת הדגשה ממתינה לאישור מנהל</p>
            {highlightPending.reason && (
              <p className="text-sm text-orange-700 mt-1">הערות: {highlightPending.reason}</p>
            )}
          </div>
        )}
        
        {/* Request Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">סוג ההדגשה</label>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="serviceCard"
                name="requestType"
                value="SERVICE_CARD"
                checked={requestType === 'SERVICE_CARD'}
                onChange={() => setRequestType('SERVICE_CARD')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <label htmlFor="serviceCard" className="font-medium text-gray-900 cursor-pointer">
                  כרטיס שירות מודגש
                </label>
                <p className="text-sm text-gray-600">
                  הכרטיס שלך יוצג במקום בולט ברשימת נותני השירות
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="businessPage"
                name="requestType"
                value="BUSINESS_PAGE"
                checked={requestType === 'BUSINESS_PAGE'}
                onChange={() => setRequestType('BUSINESS_PAGE')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <label htmlFor="businessPage" className="font-medium text-gray-900 cursor-pointer">
                  עמוד עסקי מומלץ
                </label>
                <p className="text-sm text-gray-600">
                  העמוד העסקי שלך יסומן כ"מומלץ" ויקבל מיקום מועדף
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            למה אתה מעוניין בהדגשה? (אופציונלי)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="ספר לנו על השירותים שלך, מה מייחד אותך..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">{reason.length} / 500 תווים</p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={requestMutation.isPending}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
        >
          {requestMutation.isPending ? 'שולח בקשה...' : 'שלח בקשת הדגשה'}
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">מה קורה אחרי שליחת הבקשה?</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• הבקשה נשלחת למנהלי המערכת לבדיקה</li>
          <li>• תקבל עדכון במייל לאחר טיפול בבקשה</li>
          <li>• בקשות מאושרות יופעלו תוך 24-48 שעות</li>
          <li>• ניתן לשלוח בקשה חדשה כל עת</li>
        </ul>
      </div>
    </div>
  );
};

export default SPHighlightRequestTab;
