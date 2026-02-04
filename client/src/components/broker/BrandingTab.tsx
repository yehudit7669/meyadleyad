import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUpdateOfficeDetails, useUploadLogo } from '../../hooks/useBroker';
import { BrokerProfile } from '../../services/brokerService';
import api, { pendingApprovalsService } from '../../services/api';

interface Props {
  profile: BrokerProfile;
}

const BrandingTab: React.FC<Props> = ({ profile }) => {
  const [formData, setFormData] = useState({
    aboutBusinessPending: profile.office?.aboutBusinessPending || profile.office?.aboutBusinessApproved || '',
    publishOfficeAddress: profile.office?.publishOfficeAddress || false,
  });
  const [logoError, setLogoError] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState<string | null>(null);

  const updateOffice = useUpdateOfficeDetails();
  const uploadLogo = useUploadLogo();

  // Fetch user's approval requests
  const { data: myApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: pendingApprovalsService.getMyApprovals,
    refetchInterval: 5000, // רענון כל 5 שניות
  });

  // Find relevant approvals - get the most recent one for each type
  const getLatestRejection = (type: string) => {
    const rejections = myApprovals?.filter((a: any) => a.type === type && a.status === 'REJECTED') || [];
    if (rejections.length === 0) return null;
    // Sort by reviewedAt (most recent first) and return the first one
    return rejections.sort((a: any, b: any) => 
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    )[0];
  };

  const logoApproval = getLatestRejection('LOGO_UPLOAD');
  const aboutApproval = getLatestRejection('ABOUT_UPDATE');
  const logoApproved = myApprovals?.find((a: any) => a.type === 'LOGO_UPLOAD' && a.status === 'APPROVED');
  const aboutApproved = myApprovals?.find((a: any) => a.type === 'ABOUT_UPDATE' && a.status === 'APPROVED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // אם יש לוגו חדש, שלח אותו קודם
    if (newLogoUrl) {
      await uploadLogo.mutateAsync(newLogoUrl);
      setNewLogoUrl(null); // איפוס לאחר שליחה
    }
    
    // שלח את שאר השדות
    await updateOffice.mutateAsync(formData);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous error
    setLogoError('');

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setLogoError('יש להעלות קובץ JPG או PNG בלבד');
      e.target.value = '';
      return;
    }

    // Validate file size (500KB = 500 * 1024 bytes)
    if (file.size > 500 * 1024) {
      setLogoError('הקובץ גדול מדי. אנא העלו לוגו עד 500KB');
      e.target.value = '';
      return;
    }

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // The URL returned is /uploads/filename.ext
      // We need to use the base server URL without /api
      const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      const imageUrl = `${baseUrl}${(response.data as any).url}`;
      
      // שמור ב-state בלבד, לא לשלוח עדיין
      setNewLogoUrl(imageUrl);
    } catch (error) {
      setLogoError('שגיאה בהעלאת הלוגו. נסה שוב.');
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">מיתוג ועמוד עסקי</h2>

      {/* Logo Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">לוגו עסק</h3>
        <div className="space-y-4">
          {/* לוגו מאושר */}
          <div>
            <p className="text-sm text-gray-600 mb-2">לוגו נוכחי</p>
            {profile.office?.logoUrlApproved ? (
              <img
                src={profile.office.logoUrlApproved}
                alt="לוגו מאושר"
                className="w-40 h-40 object-contain border rounded-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">אין לוגו</span>
              </div>
            )}
          </div>

          {/* העלאת לוגו חדש */}
          <div>
            <p className="text-sm text-gray-600 mb-2">העלה לוגו חדש</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">PNG/JPG עד 500KB</p>
            {logoError && (
              <p className="text-sm text-red-600 mt-2">{logoError}</p>
            )}
          </div>

          {/* הודעות סטטוס */}
          {newLogoUrl && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-semibold mb-2">🔵 לוגו חדש - ישלח לאישור לאחר לחיצה על "שמור שינויים"</p>
              <img
                src={newLogoUrl}
                alt="לוגו חדש"
                className="w-40 h-40 object-contain border-2 border-blue-400 rounded-lg"
              />
            </div>
          )}
          
          {profile.office?.logoUrlPending && profile.office?.logoUrlPending !== profile.office?.logoUrlApproved && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-600 font-semibold mb-2">⏳ לוגו ממתין לאישור</p>
              <img
                src={profile.office.logoUrlPending}
                alt="לוגו ממתין"
                className="w-40 h-40 object-contain border rounded-lg"
              />
            </div>
          )}
          
          {logoApproved && !(profile.office?.logoUrlPending && profile.office?.logoUrlPending !== profile.office?.logoUrlApproved) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">✅ לוגו חדש אושר!</p>
              {logoApproved.adminNotes && (
                <p className="text-sm text-green-700">הערת מנהל: {logoApproved.adminNotes}</p>
              )}
            </div>
          )}
          
          {logoApproval && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">❌ הבקשה ללוגו נדחתה</p>
              {logoApproval.adminNotes && (
                <p className="text-sm text-red-700">הערת מנהל: {logoApproval.adminNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <form onSubmit={handleSubmit} className="border-t pt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אודות העסק
          </label>
          <textarea
            value={formData.aboutBusinessPending}
            onChange={(e) => setFormData({ ...formData, aboutBusinessPending: e.target.value })}
            rows={5}
            maxLength={1000}
            placeholder="ספר על העסק, ההתמחות, הניסיון..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.aboutBusinessPending.length}/1000 תווים
          </p>
          {profile.office?.aboutBusinessPending && profile.office?.aboutBusinessPending !== profile.office?.aboutBusinessApproved && (
            <p className="text-sm text-orange-600 mt-1">⏳ שינוי ממתין לאישור</p>
          )}
          {aboutApproved && !(profile.office?.aboutBusinessPending && profile.office?.aboutBusinessPending !== profile.office?.aboutBusinessApproved) && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">✅ עדכון אודות העסק אושר!</p>
              {aboutApproved.adminNotes && (
                <p className="text-sm text-green-700">הערת מנהל: {aboutApproved.adminNotes}</p>
              )}
            </div>
          )}
          {aboutApproval && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">❌ הבקשה לעדכון אודות העסק נדחתה</p>
              {aboutApproval.adminNotes && (
                <p className="text-sm text-red-700">הערת מנהל: {aboutApproval.adminNotes}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="publishOfficeAddress"
            checked={formData.publishOfficeAddress}
            onChange={(e) => setFormData({ ...formData, publishOfficeAddress: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="publishOfficeAddress" className="text-sm font-medium text-gray-700">
            פרסם את כתובת המשרד בעמוד האישי
          </label>
        </div>

        <button
          type="submit"
          disabled={updateOffice.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {updateOffice.isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
      </form>
    </div>
  );
};

export default BrandingTab;
