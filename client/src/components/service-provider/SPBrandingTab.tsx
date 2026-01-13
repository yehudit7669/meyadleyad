import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { serviceProviderService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
  profile: any;
  onUpdate: () => void;
}

const SPBrandingTab: React.FC<Props> = ({ profile, onUpdate }) => {
  const [aboutText, setAboutText] = useState(profile.aboutBusinessPending || profile.aboutBusiness || '');
  const [publishAddress, setPublishAddress] = useState(profile.publishOfficeAddress || false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: serviceProviderService.updateProfile,
    onSuccess: () => {
      toast.success('הגדרות מיתוג עודכנו בהצלחה');
      onUpdate();
    },
    onError: () => {
      toast.error('שגיאה בעדכון הגדרות מיתוג');
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
    updateMutation.mutate({
      aboutBusinessPending: aboutText,
    });
  };

  const handleSavePublishAddress = () => {
    updateMutation.mutate({
      publishOfficeAddress: publishAddress,
    });
  };

  const handleUploadLogo = () => {
    if (!logoFile || !logoPreview) {
      toast.error('לא נבחר קובץ');
      return;
    }

    // In a real implementation, upload to server first, get URL
    // For now, we'll just save the preview URL as pending
    updateMutation.mutate({
      logoUrlPending: logoPreview,
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">מיתוג ועמוד עסקי</h2>

      {/* Logo Upload */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">העלאת לוגו</h3>
        
        {profile.logoStatus === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⏳ לוגו ממתין לאישור מנהל
            </p>
          </div>
        )}

        {profile.logoStatus === 'APPROVED' && profile.logoUrlPending && (
          <div className="mb-4">
            <img 
              src={profile.logoUrlPending} 
              alt="Logo" 
              className="h-24 w-auto object-contain border rounded-lg p-2"
            />
            <p className="text-sm text-green-600 mt-2">✓ לוגו מאושר</p>
          </div>
        )}

        <div className="space-y-4">
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
          <p className="text-xs text-gray-500">
            קבצים מותרים: PNG, JPG | גודל מקסימלי: 500KB
          </p>

          {logoPreview && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">תצוגה מקדימה:</p>
              <img 
                src={logoPreview} 
                alt="Preview" 
                className="h-24 w-auto object-contain border rounded-lg p-2 mb-2"
              />
              <button
                onClick={handleUploadLogo}
                disabled={updateMutation.isPending}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {updateMutation.isPending ? 'שולח לאישור...' : 'העלה לוגו (לאישור)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* About Business */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">אודות העסק</h3>
        
        {profile.aboutBusinessStatus === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⏳ טקסט "אודות" ממתין לאישור מנהל
            </p>
          </div>
        )}

        {profile.aboutBusinessStatus === 'APPROVED' && profile.aboutBusiness && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              ✓ טקסט מאושר ומוצג בעמוד הציבורי
            </p>
          </div>
        )}

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
            disabled={updateMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {updateMutation.isPending ? 'שומר...' : 'שמור (לאישור)'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          שינויים ב"אודות" דורשים אישור מנהל לפני פרסום
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
