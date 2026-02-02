import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceProviderService, pendingApprovalsService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
  profile: any;
  onUpdate: () => void;
}

const SPBrandingTab: React.FC<Props> = ({ profile, onUpdate }) => {
  const queryClient = useQueryClient();
  const [aboutText, setAboutText] = useState(profile.aboutBusinessPending || profile.aboutBusiness || '');
  const [publishAddress, setPublishAddress] = useState(profile.publishOfficeAddress || false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch user's approval requests
  const { data: myApprovals } = useQuery({
    queryKey: ['my-approvals'],
    queryFn: pendingApprovalsService.getMyApprovals,
    refetchInterval: 5000, // רענון כל 5 שניות
  });

  // Find relevant rejections - get the most recent one for each type
  const getLatestRejection = (type: string) => {
    const rejections = myApprovals?.filter((a: any) => a.type === type && a.status === 'REJECTED') || [];
    if (rejections.length === 0) return null;
    // Sort by reviewedAt (most recent first) and return the first one
    return rejections.sort((a: any, b: any) => 
      new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
    )[0];
  };

  const logoRejection = getLatestRejection('LOGO_UPLOAD');
  const aboutRejection = getLatestRejection('ABOUT_UPDATE');
  const logoApproved = myApprovals?.find((a: any) => a.type === 'LOGO_UPLOAD' && a.status === 'APPROVED');
  const aboutApproved = myApprovals?.find((a: any) => a.type === 'ABOUT_UPDATE' && a.status === 'APPROVED');

  const updateMutation = useMutation({
    mutationFn: serviceProviderService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('הגדרות מיתוג עודכנו בהצלחה');
      onUpdate();
    },
    onError: () => {
      toast.error('שגיאה בעדכון הגדרות מיתוג');
    },
  });

  const createApprovalMutation = useMutation({
    mutationFn: pendingApprovalsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      toast.success('הבקשה נשלחה לאישור מנהל');
      onUpdate();
    },
    onError: () => {
      toast.error('שגיאה בשליחת הבקשה');
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('יש להעלות קובץ PNG או JPG בלבד');
      return;
    }

    // Validate file size (500KB)
    if (file.size > 500 * 1024) {
      toast.error('גודל הקובץ חייב להיות עד 500KB');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAbout = () => {
    let hasChanges = false;

    // אם יש לוגו חדש, שלח אותו
    if (logoFile && logoPreview) {
      createApprovalMutation.mutate({
        type: 'LOGO_UPLOAD',
        requestData: {
          logoUrl: logoPreview,
        },
        oldData: {
          logoUrl: profile.avatar,
        },
        reason: 'העלאת לוגו חדש',
      });
      // אפס את הלוגו לאחר שליחה
      setLogoFile(null);
      setLogoPreview(null);
      hasChanges = true;
    }
    
    // שליחת בקשה לאישור רק אם יש שינוי משמעותי בטקסט
    const currentAbout = profile.aboutBusiness || '';
    const pendingAbout = profile.aboutBusinessPending || '';
    const newAbout = aboutText || '';
    
    if (newAbout && newAbout !== currentAbout && newAbout !== pendingAbout) {
      createApprovalMutation.mutate({
        type: 'ABOUT_UPDATE',
        requestData: {
          aboutBusiness: aboutText,
        },
        oldData: {
          aboutBusiness: profile.aboutBusiness,
        },
        reason: 'עדכון תיאור העסק',
      });
      hasChanges = true;
    }

    if (!hasChanges) {
      toast('לא בוצעו שינויים');
    }
  };

  const handleSavePublishAddress = () => {
    updateMutation.mutate({
      publishOfficeAddress: publishAddress,
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">מיתוג ועמוד עסקי</h2>

      {/* Logo Upload */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">העלאת לוגו</h3>
        
        <div className="space-y-4">
          {/* לוגו נוכחי */}
          {profile.logoStatus === 'APPROVED' && profile.logoUrlPending && (
            <div>
              <p className="text-sm text-gray-600 mb-2">לוגו נוכחי</p>
              <img 
                src={profile.logoUrlPending} 
                alt="Logo" 
                className="w-40 h-40 object-contain border rounded-lg"
              />
            </div>
          )}

          {/* העלאת לוגו חדש */}
          <div>
            <p className="text-sm text-gray-600 mb-2">העלה לוגו חדש</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              קבצים מותרים: PNG, JPG | גודל מקסימלי: 500KB
            </p>
          </div>

          {/* הודעות סטטוס - רק אחת בכל פעם */}
          {profile.logoStatus === 'PENDING' ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold">
                ⏳ לוגו ממתין לאישור מנהל
              </p>
            </div>
          ) : logoPreview ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-700 mb-2">🔵 לוגו חדש - יישלח לאישור לאחר לחיצה על "שמור שינויים"</p>
              <img 
                src={logoPreview} 
                alt="Preview" 
                className="w-40 h-40 object-contain border-2 border-blue-400 rounded-lg"
              />
            </div>
          ) : logoRejection ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-1">❌ הבקשה ללוגו נדחתה</p>
              {logoRejection.adminNotes && (
                <p className="text-sm text-red-700">הערת מנהל: {logoRejection.adminNotes}</p>
              )}
            </div>
          ) : logoApproved ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-1">✅ לוגו חדש אושר!</p>
              {logoApproved.adminNotes && (
                <p className="text-sm text-green-700">הערת מנהל: {logoApproved.adminNotes}</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* About Business */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">אודות העסק</h3>
        
        {/* הודעות סטטוס - רק אחת בכל פעם */}
        {profile.aboutBusinessStatus === 'PENDING' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⏳ טקסט "אודות" ממתין לאישור מנהל
            </p>
          </div>
        ) : aboutRejection ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-red-800 mb-1">❌ הבקשה לעדכון אודות העסק נדחתה</p>
            {aboutRejection.adminNotes && (
              <p className="text-sm text-red-700">הערת מנהל: {aboutRejection.adminNotes}</p>
            )}
          </div>
        ) : aboutApproved ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ עדכון אודות העסק אושר!</p>
            {aboutApproved.adminNotes && (
              <p className="text-sm text-green-700">הערת מנהל: {aboutApproved.adminNotes}</p>
            )}
          </div>
        ) : null}

        <textarea
          value={aboutText}
          onChange={(e) => setAboutText(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="ספר על העסק שלך, הניסיון שלך, התמחויות ושירותים..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">{aboutText.length} / 2000 תווים</p>
          <button
            onClick={handleSaveAbout}
            disabled={createApprovalMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {createApprovalMutation.isPending ? 'שומר...' : 'שמור שינויים (לאישור)'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          שינויים במיתוג (לוגו ואודות) דורשים אישור מנהל לפני פרסום
        </p>
      </div>

      {/* Publish Office Address */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">הגדרות פרסום</h3>
        
        <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-lg">
          <input
            type="checkbox"
            id="publishAddress"
            checked={publishAddress}
            onChange={(e) => setPublishAddress(e.target.checked)}
            className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="publishAddress" className="font-medium text-gray-900 cursor-pointer">
              פרסם את כתובת המשרד בעמוד האישי
            </label>
            <p className="text-sm text-gray-600 mt-1">
              כאשר מסומן, כתובת המשרד שלך תוצג בעמוד העסקי הציבורי
            </p>
          </div>
        </div>

        {publishAddress !== profile.publishOfficeAddress && (
          <button
            onClick={handleSavePublishAddress}
            disabled={updateMutation.isPending}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'שומר...' : 'שמור העדפה'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SPBrandingTab;
