import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface AvailabilityEditorProps {
  adId: string;
}

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function AvailabilityEditor({ adId }: AvailabilityEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // אם המשתמש חסום מתיאום פגישות - לא מציגים את הרכיב
  if (user?.meetingsBlocked) {
    return null;
  }

  // שליפת זמינות קיימת
  const { data: existingSlots = [] } = useQuery({
    queryKey: ['availability', adId],
    queryFn: () => appointmentsService.getAdAvailability(adId),
  });

  useEffect(() => {
    if (existingSlots.length > 0) {
      setSlots(existingSlots);
    }
  }, [existingSlots]);

  // שמירת זמינות
  const saveMutation = useMutation({
    mutationFn: () => appointmentsService.setAdAvailability({ adId, slots }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', adId] });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const addSlot = () => {
    setSlots([
      ...slots,
      {
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '17:00',
      },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200" dir="rtl">
      <h3 className="text-xl font-bold text-[#1F3F3A] mb-4 flex items-center gap-2">
        <span>📅</span>
        הגדרת זמינות לפגישות
      </h3>

      <p className="text-gray-600 mb-4">
        הגדר את הזמנים בהם אתה זמין לקבל מבקרים לנכס זה
      </p>

      {showSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ הזמינות נשמרה בהצלחה
        </div>
      )}

      {saveMutation.isError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          שגיאה בשמירת הזמינות
        </div>
      )}

      <div className="space-y-4 mb-4">
        {slots.map((slot, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* בחירת יום */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                יום בשבוע
              </label>
              <select
                value={slot.dayOfWeek}
                onChange={(e) =>
                  updateSlot(index, 'dayOfWeek', parseInt(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dayNames.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* שעת התחלה */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                משעה
              </label>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* שעת סיום */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                עד שעה
              </label>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* כפתור מחיקה */}
            <button
              type="button"
              onClick={() => removeSlot(index)}
              className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
            >
              ✗ הסר
            </button>
          </div>
        ))}

        {slots.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            לא הוגדרו זמנים זמינים. הוסף זמנים בלחיצה על הכפתור למטה.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={addSlot}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition"
        >
          + הוסף זמן זמין
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saveMutation.isPending ? 'שומר...' : 'שמור זמינות'}
        </button>
      </div>
    </div>
  );
}
