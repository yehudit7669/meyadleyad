import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

interface AppointmentCardProps {
  adId: string;
  adOwnerId: string;
}

export default function AppointmentCard({ adId, adOwnerId }: AppointmentCardProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [note, setNote] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // טעינת זמינות המודעה
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['availability', adId],
    queryFn: () => appointmentsService.getAdAvailability(adId),
  });

  // בקשת פגישה
  const requestMutation = useMutation({
    mutationFn: appointmentsService.requestAppointment,
    onSuccess: () => {
      setShowSuccess(true);
      setSelectedDate('');
      setSelectedTime('');
      setNote('');
      setTimeout(() => setShowSuccess(false), 5000);
    },
  });

  // אם לא מחובר
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200" dir="rtl">
        <h3 className="text-xl font-bold text-[#1F3F3A] mb-4 flex items-center gap-2">
          <span>📅</span>
          קביעת פגישה להצגת הנכס
        </h3>
        <p className="text-gray-600 mb-4">
          כדי להזמין פגישה להצגת נכס, עליך להתחבר לחשבונך
        </p>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="bg-[#C9A24D] text-[#1F3F3A] px-6 py-2 rounded-lg font-bold hover:bg-[#B08C3C] transition"
          >
            התחברות
          </Link>
          <Link
            to="/register"
            className="bg-gray-200 text-[#1F3F3A] px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition"
          >
            הרשמה
          </Link>
        </div>
      </div>
    );
  }

  // אם זה המודעה של המשתמש
  if (user.id === adOwnerId) {
    return null; // לא מציגים את הרכיב
  }

  // אם אין slots זמינים
  if (!loadingSlots && slots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200" dir="rtl">
        <h3 className="text-xl font-bold text-[#1F3F3A] mb-4 flex items-center gap-2">
          <span>📅</span>
          קביעת פגישה
        </h3>
        <p className="text-gray-600">
          בעל הנכס טרם הגדיר זמינות לפגישות. אנא צור קשר ישירות.
        </p>
      </div>
    );
  }

  // קבלת ימים זמינים
  const availableDays = Array.from(new Set(slots.map((s: any) => s.dayOfWeek))).sort() as number[];
  
  // המרת יום בשבוע למחרוזת
  const dayNames: string[] = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // קבלת טווחי זמן זמינים ליום נבחר
  const getTimeSlotsForDate = (dateStr: string) => {
    if (!dateStr) return [];
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    const daySlots = slots.filter((s: any) => s.dayOfWeek === dayOfWeek);
    const times: string[] = [];
    
    daySlots.forEach((slot: any) => {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      
      // יצירת אינטרוולים של 30 דקות
      let currentH = startH;
      let currentM = startM;
      
      while (currentH < endH || (currentH === endH && currentM < endM)) {
        times.push(`${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`);
        currentM += 30;
        if (currentM >= 60) {
          currentM -= 60;
          currentH++;
        }
      }
    });
    
    return times;
  };

  const timeSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      alert('נא לבחור תאריך ושעה');
      return;
    }

    // יצירת ISO string מהתאריך והשעה
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    requestMutation.mutate({
      adId,
      date: appointmentDate.toISOString(),
      note: note || undefined,
    });
  };

  // קבלת התאריכים המינימלי והמקסימלי (חודש קדימה)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200" dir="rtl">
      <h3 className="text-xl font-bold text-[#1F3F3A] mb-4 flex items-center gap-2">
        <span>📅</span>
        קביעת פגישה להצגת הנכס
      </h3>

      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          הבקשה נשלחה בהצלחה! נעדכן אותך עם אישור הפגישה.
        </div>
      )}

      {requestMutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {(requestMutation.error as any)?.response?.data?.message || 'אירעה שגיאה. נסה שנית.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* בחירת תאריך */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            בחר תאריך
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime(''); // איפוס שעה
            }}
            min={today.toISOString().split('T')[0]}
            max={maxDate.toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
            required
          />
          {availableDays.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              ימים זמינים: {availableDays.map(d => dayNames[d]).join(', ')}
            </p>
          )}
        </div>

        {/* בחירת שעה */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              בחר שעה
            </label>
            {timeSlots.length > 0 ? (
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A24D]"
                required
              >
                <option value="">בחר שעה...</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-red-600 text-sm">
                אין זמינות ביום זה. אנא בחר יום אחר.
              </p>
            )}
          </div>
        )}

        {/* הערה */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערה (אופציונלי)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="הערות נוספות לבעל הנכס..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A24D] resize-none"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* כפתור שליחה */}
        <button
          type="submit"
          disabled={requestMutation.isPending || !selectedDate || !selectedTime}
          className="w-full bg-[#C9A24D] text-[#1F3F3A] py-3 rounded-lg font-bold hover:bg-[#B08C3C] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {requestMutation.isPending ? 'שולח...' : 'שלח בקשה להצגת הנכס'}
        </button>
      </form>
    </div>
  );
}
