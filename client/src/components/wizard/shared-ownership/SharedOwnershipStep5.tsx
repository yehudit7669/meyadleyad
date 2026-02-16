import React, { useState, useEffect } from 'react';
import { SharedOwnershipStep5Data } from '../../../types/wizard';
import { sharedOwnershipStep5Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { brokerService } from '../../../services/brokerService';

const SharedOwnershipStep5: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const { user } = useAuth();
  const isBroker = user?.role === 'BROKER' || user?.isBroker === true;
  
  const { data: teamMembers } = useQuery({
    queryKey: ['broker', 'team'],
    queryFn: brokerService.getTeamMembers,
    enabled: isBroker,
  });
  
  const { data: brokerProfile } = useQuery({
    queryKey: ['broker', 'profile'],
    queryFn: brokerService.getProfile,
    enabled: isBroker,
  });
  
  const brokerTeam = isBroker && teamMembers ? teamMembers : [];

  const [formData, setFormData] = useState<SharedOwnershipStep5Data>(
    data || {
      contactName: '',
      contactPhone: '',
      agreeToTerms: false,
      weeklyDigestOptIn: false,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');

  useEffect(() => {
    if (selectedBrokerId === 'OFFICE' && brokerProfile?.office) {
      setFormData((prev) => ({
        ...prev,
        contactName: brokerProfile.office?.businessName || '',
        contactPhone: brokerProfile.office?.businessPhone || '',
      }));
    } else if (selectedBrokerId && selectedBrokerId !== 'OFFICE' && brokerTeam.length > 0) {
      const selectedBroker = brokerTeam.find((member: any) => member.id === selectedBrokerId);
      if (selectedBroker) {
        setFormData((prev) => ({
          ...prev,
          contactName: selectedBroker.fullName || '',
          contactPhone: selectedBroker.phone || '',
        }));
      }
    }
  }, [selectedBrokerId, brokerTeam, brokerProfile]);

  const handleChange = (field: keyof SharedOwnershipStep5Data, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    try {
      sharedOwnershipStep5Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          newErrors[err.path[0]] = err.message;
        });
      }
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי התקשרות</h2>
        <p className="text-gray-600">מלא את פרטי יצירת הקשר שלך</p>
      </div>

      <div className="space-y-6">
        {isBroker && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              בחר מתווך מהצוות או משרד
            </label>
            {brokerTeam.length > 0 || brokerProfile?.office?.businessName ? (
              <>
                <select
                  value={selectedBrokerId}
                  onChange={(e) => setSelectedBrokerId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
                >
                  <option value="">בחר מתווך או הזן באופן ידני</option>
                  {brokerProfile?.office?.businessName && (
                    <option value="OFFICE">
                      🏢 {brokerProfile.office.businessName} - {brokerProfile.office.businessPhone}
                    </option>
                  )}
                  {brokerTeam.map((member: any) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} - {member.phone}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  בחר מתווך מהצוות שלך, בחר את המשרד, או הפרטים יועלו אוטומטית
                </p>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  💡 אין חברי צוות במערכת. 
                  <a href="/broker/my-profile?tab=team" className="font-medium underline mr-1">
                    לחץ כאן להוסיף חברי צוות
                  </a>
                  או המשך למלא באופן ידני.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם {!isBroker && '(אופציונלי)'}
          </label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => handleChange('contactName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.contactName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="הזן שם מלא"
          />
          {errors.contactName && (
            <p className="mt-1 text-sm text-red-500">{errors.contactName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            טלפון <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.contactPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="לדוגמה: 0501234567"
            dir="ltr"
          />
          {errors.contactPhone && (
            <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>
          )}
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
          <input
            type="checkbox"
            checked={formData.weeklyDigestOptIn}
            onChange={(e) => handleChange('weeklyDigestOptIn', e.target.checked)}
            className="mt-1 w-5 h-5 text-[#C9A24D] focus:ring-[#C9A24D] border-gray-300 rounded"
          />
          <div>
            <label className="text-sm font-medium text-gray-900 cursor-pointer">
              קבל עדכונים שבועיים במייל
            </label>
            <p className="text-xs text-gray-600 mt-1">
              קבל סיכום שבועי עם מודעות חדשות בתחומים שמעניינים אותך
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
            className={`mt-1 w-5 h-5 text-[#C9A24D] focus:ring-[#C9A24D] rounded ${
              errors.agreeToTerms ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-900 cursor-pointer">
              אני מסכים ל<a href="/terms" target="_blank" className="text-[#C9A24D] hover:underline">תנאי השימוש</a> ול<a href="/privacy" target="_blank" className="text-[#C9A24D] hover:underline">מדיניות הפרטיות</a> <span className="text-red-500">*</span>
            </label>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-500">{errors.agreeToTerms}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-[#1F3F3A] hover:text-white transition-all"
        >
          ← הקודם
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] rounded-lg font-bold hover:bg-[#B08C3C] transition-all shadow-lg hover:shadow-xl"
        >
          הבא →
        </button>
      </div>
    </div>
  );
};

export default SharedOwnershipStep5;
