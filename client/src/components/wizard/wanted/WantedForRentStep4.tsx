import React, { useState, useEffect } from 'react';
import { WantedForRentStep4Data, wantedForRentStep4Schema } from '../../../types/wizard';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { brokerService } from '../../../services/brokerService';

interface Props {
  data?: WantedForRentStep4Data;
  onNext: (data: WantedForRentStep4Data) => void;
  onPrev: () => void;
  isLast?: boolean;
  isLoading?: boolean;
}

const WantedForRentStep4: React.FC<Props> = ({ data, onNext, onPrev, isLoading }) => {
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

  const [contactName, setContactName] = useState(data?.contactName || '');
  const [contactPhone, setContactPhone] = useState(data?.contactPhone || '');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedBrokerId === 'OFFICE' && brokerProfile?.office) {
      setContactName(brokerProfile.office?.businessName || '');
      setContactPhone(brokerProfile.office?.businessPhone || '');
    } else if (selectedBrokerId && selectedBrokerId !== 'OFFICE' && brokerTeam.length > 0) {
      const selectedBroker = brokerTeam.find((member: any) => member.id === selectedBrokerId);
      if (selectedBroker) {
        setContactName(selectedBroker.fullName || '');
        setContactPhone(selectedBroker.phone || '');
      }
    }
  }, [selectedBrokerId, brokerTeam, brokerProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: WantedForRentStep4Data = {
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim(),
    };

    try {
      wantedForRentStep4Schema.parse(formData);
      onNext(formData);
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-[#1F3F3A] mb-2">פרטי התקשרות</h2>
        <p className="text-gray-600">איך ניתן ליצור איתך קשר?</p>
      </div>

      <div className="space-y-4">
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
            שם (אופציונלי)
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="השם שלך"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            disabled={!!selectedBrokerId}
          />
          <p className="text-sm text-gray-500 mt-1">
            אם תשאיר ריק, המודעה תוצג כ"אנונימי"
          </p>
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            טלפון <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="050-1234567"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent ${
              errors.contactPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            dir="ltr"
            disabled={!!selectedBrokerId}
          />
          {errors.contactPhone && (
            <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-bold text-[#1F3F3A] mb-1">טיפ חשוב</h3>
            <p className="text-sm text-gray-700">
              ודא שמספר הטלפון תקין וזמין. מודעות עם פרטי התקשרות מדויקים מקבלות יותר פניות.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onPrev}
          disabled={isLoading}
          className="px-8 py-3 bg-white text-[#1F3F3A] border-2 border-[#1F3F3A] rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          ← חזרה
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-[#C9A24D] text-white rounded-lg font-bold hover:bg-[#B08C3C] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              מפרסם...
            </>
          ) : (
            <>פרסם מודעה ✓</>
          )}
        </button>
      </div>
    </form>
  );
};

export default WantedForRentStep4;
