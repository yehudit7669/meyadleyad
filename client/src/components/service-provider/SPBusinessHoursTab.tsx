import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { serviceProviderService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { BusinessHours, TimeRange } from '../../types';

interface Props {
  profile: any;
  onUpdate: () => void;
}

const DAYS = [
  { key: 'sun', label: 'ראשון' },
  { key: 'mon', label: 'שני' },
  { key: 'tue', label: 'שלישי' },
  { key: 'wed', label: 'רביעי' },
  { key: 'thu', label: 'חמישי' },
  { key: 'fri', label: 'שישי' },
] as const;

const SPBusinessHoursTab: React.FC<Props> = ({ profile, onUpdate }) => {
  const [hours, setHours] = useState<BusinessHours>(profile.businessHours || {});

  const updateMutation = useMutation({
    mutationFn: serviceProviderService.updateProfile,
    onSuccess: () => {
      toast.success('שעות הפעילות עודכנו בהצלחה');
      onUpdate();
    },
    onError: () => {
      toast.error('שגיאה בעדכון שעות פעילות');
    },
  });

  const addTimeRange = (day: string) => {
    setHours({
      ...hours,
      [day]: [...(hours[day as keyof BusinessHours] || []), { from: '09:00', to: '17:00' }],
    });
  };

  const removeTimeRange = (day: string, index: number) => {
    const dayHours = hours[day as keyof BusinessHours] || [];
    setHours({
      ...hours,
      [day]: dayHours.filter((_, i) => i !== index),
    });
  };

  const updateTimeRange = (day: string, index: number, field: 'from' | 'to', value: string) => {
    const dayHours = [...(hours[day as keyof BusinessHours] || [])];
    dayHours[index] = { ...dayHours[index], [field]: value };
    setHours({
      ...hours,
      [day]: dayHours,
    });
  };

  const handleSave = () => {
    // Validate times
    for (const day of DAYS) {
      const dayHours = hours[day.key];
      if (dayHours) {
        for (const range of dayHours) {
          if (range.from >= range.to) {
            toast.error(`שעת סיום חייבת להיות אחרי שעת התחלה (${day.label})`);
            return;
          }
        }
      }
    }

    updateMutation.mutate({ businessHours: hours });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">שעות פעילות</h2>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      <p className="text-gray-600">
        הגדר את שעות הפעילות שלך עבור כל יום בשבוע. ניתן להוסיף מספר טווחי שעות ליום אחד.
      </p>

      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day.key} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">{day.label}</h3>
              <button
                onClick={() => addTimeRange(day.key)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + הוסף טווח שעות
              </button>
            </div>

            {(!hours[day.key] || hours[day.key]?.length === 0) && (
              <p className="text-gray-500 text-sm">סגור</p>
            )}

            <div className="space-y-2">
              {(hours[day.key] || []).map((range: TimeRange, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={range.from}
                      onChange={(e) => updateTimeRange(day.key, index, 'from', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-600">עד</span>
                    <input
                      type="time"
                      value={range.to}
                      onChange={(e) => updateTimeRange(day.key, index, 'to', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => removeTimeRange(day.key, index)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    הסר
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 שעות הפעילות יוצגו בעמוד העסקי הציבורי שלך ויעזרו ללקוחות לדעת מתי ניתן לפנות אליך.
        </p>
      </div>
    </div>
  );
};

export default SPBusinessHoursTab;
