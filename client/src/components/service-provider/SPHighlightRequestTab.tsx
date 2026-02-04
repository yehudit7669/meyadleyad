import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, pendingApprovalsService } from '../../services/api';
import { toast } from 'react-hot-toast';

const SPHighlightRequestTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAdId, setSelectedAdId] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch user's ads
  const { data: ads = [] } = useQuery({
    queryKey: ['my-ads'],
    queryFn: () => usersService.getMyAds(),
  });

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

  const activeAds = ads.filter((ad: any) => ad.status === 'ACTIVE');

  const createRequest = useMutation({
    mutationFn: async (data: { adId: string; notes: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pending-approvals/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: 'HIGHLIGHT_AD',
          adId: data.adId,
          reason: data.notes,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשליחת הבקשה');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('בקשת הדגשה נשלחה בהצלחה');
      setSelectedAdId('');
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'שגיאה בשליחת בקשת הדגשה');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdId) {
      alert('נא לבחור מודעה');
      return;
    }

    await createRequest.mutateAsync({ adId: selectedAdId, notes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">בקשת הדגשה</h2>
        <p className="text-gray-600">
          בקש להדגיש אחת מהמודעות שלך. הבקשה תטופל על ידי מנהל.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-200 space-y-4">
        
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            בחר מודעה להדגשה *
          </label>
          <select
            value={selectedAdId}
            onChange={(e) => setSelectedAdId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">-- בחר מודעה --</option>
            {activeAds.map((ad: any) => (
              <option key={ad.id} value={ad.id}>
                #{ad.adNumber} - {ad.title}
              </option>
            ))}
          </select>
          {activeAds.length === 0 && (
            <p className="text-sm text-red-600 mt-1">
              אין לך מודעות פעילות כרגע. פרסם מודעה תחילה.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערות (אופציונלי)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="ספר למנהל מדוע מודעה זו ראויה להדגשה..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {notes.length}/500 תווים
          </p>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            ⭐ <strong>שים לב:</strong> ניתן להדגיש מודעה אחת בלבד בכל פעם. המודעה המודגשת תקבל חשיפה מיוחדת בדף הבית ובתוצאות החיפוש.
          </p>
        </div>

        <button
          type="submit"
          disabled={createRequest.isPending || activeAds.length === 0}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 font-semibold"
        >
          {createRequest.isPending ? 'שולח בקשה...' : '⭐ שלח בקשה להדגשה'}
        </button>
      </form>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3">מה כולל הדגשה?</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>הצגה בולטת בדף הבית</li>
          <li>סימון מיוחד בתוצאות החיפוש</li>
          <li>חשיפה מוגברת למעוניינים</li>
          <li>עדיפות בהודעות שבועיות</li>
        </ul>
      </div>
    </div>
  );
};

export default SPHighlightRequestTab;
