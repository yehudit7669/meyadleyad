import React, { useState, useEffect } from 'react';
import { ResidentialStep5Data } from '../../../types/wizard';
import { residentialStep5Schema } from '../../../types/wizard';
import { WizardStepProps } from '../../../types/wizard';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { brokerService } from '../../../services/brokerService';

const ResidentialStep5: React.FC<WizardStepProps> = ({ data, onNext, onPrev }) => {
  const { user } = useAuth();
  const isBroker = user?.role === 'BROKER' || user?.isBroker === true;
  
  // Fetch team members only if user is a broker
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

  const [formData, setFormData] = useState<ResidentialStep5Data>(
    data || {
      contactName: '',
      contactPhone: '',
      agreeToTerms: true, // Always true since we removed the checkbox
      weeklyDigestOptIn: false,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');

  // Auto-fill phone when broker is selected
  useEffect(() => {
    if (selectedBrokerId === 'OFFICE' && brokerProfile?.office) {
      // Fill office details
      setFormData((prev) => ({
        ...prev,
        contactName: brokerProfile.office?.businessName || '',
        contactPhone: brokerProfile.office?.businessPhone || '',
      }));
    } else if (selectedBrokerId && selectedBrokerId !== 'OFFICE' && brokerTeam.length > 0) {
      // Fill broker member details
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

  const handleChange = (field: keyof ResidentialStep5Data, value: any) => {
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
      residentialStep5Schema.parse(formData);
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
        {/* Broker Selection - Only for brokers */}
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

        {/* Contact Name */}
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
            placeholder="לדוגמה: יוסי כהן"
            disabled={!!selectedBrokerId}
          />
          {errors.contactName && (
            <p className="mt-1 text-sm text-red-500">{errors.contactName}</p>
          )}
        </div>

        {/* Contact Phone */}
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
            disabled={!!selectedBrokerId}
          />
          {errors.contactPhone && (
            <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            מספר טלפון ישראלי תקין (נייד או קווי)
          </p>
        </div>

        {/* Weekly Digest Opt-in */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.weeklyDigestOptIn || false}
              onChange={(e) => handleChange('weeklyDigestOptIn', e.target.checked)}
              className="mt-1 w-5 h-5 text-[#C9A24D] border-gray-300 rounded focus:ring-[#C9A24D] cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-[#1F3F3A]">
                שלח לי את הלוח השבועי באימייל לאחר הפרסום
              </div>
              <p className="text-sm text-gray-600 mt-1">
               קובץ PDF מסודר עם כל פרטי המודעה כפי שתפורסם באתר
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">הגנת הפרטיות שלך:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>מספר הטלפון שלך יוצג רק למשתמשים מעוניינים</li>
                <li>ניתן לערוך או להסיר את המודעה בכל עת</li>
                <li>המערכת לא תשתף את הפרטים שלך עם גורמי צד שלישי</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation */}
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
          className="px-8 py-3 bg-[#C9A24D] text-[#1F3F3A] hover:bg-[#B08C3C] shadow-lg hover:shadow-xl rounded-lg font-bold transition-all"
        >
          המשך לתצוגה מקדימה →
        </button>
      </div>
    </div>
  );
};

export default ResidentialStep5;
