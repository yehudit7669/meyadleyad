import React, { useState } from 'react';
import { useUpdateOfficeDetails, useUploadLogo } from '../../hooks/useBroker';
import { BrokerProfile } from '../../services/brokerService';

interface Props {
  profile: BrokerProfile;
}

const BrandingTab: React.FC<Props> = ({ profile }) => {
  const [formData, setFormData] = useState({
    aboutBusinessPending: profile.office?.aboutBusinessPending || profile.office?.aboutBusinessApproved || '',
    publishOfficeAddress: profile.office?.publishOfficeAddress || false,
  });
  const [logoError, setLogoError] = useState('');

  const updateOffice = useUpdateOfficeDetails();
  const uploadLogo = useUploadLogo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    // In real implementation, upload to cloud storage
    // For now, simulate upload
    const mockUrl = URL.createObjectURL(file);
    await uploadLogo.mutateAsync(mockUrl);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">מיתוג ועמוד עסקי</h2>

      {/* Logo Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">לוגו עסק</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">לוגו מאושר</p>
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
            {profile.office?.logoUrlPending && profile.office?.logoUrlPending !== profile.office?.logoUrlApproved && (
              <div className="mt-3">
                <p className="text-sm text-orange-600 mb-2">⏳ לוגו ממתין לאישור:</p>
                <img
                  src={profile.office.logoUrlPending}
                  alt="לוגו ממתין"
                  className="w-40 h-40 object-contain border rounded-lg"
                />
              </div>
            )}
          </div>
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
