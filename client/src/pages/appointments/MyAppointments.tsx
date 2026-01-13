import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '../../services/api';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function MyAppointments() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: appointmentsService.getMyAppointments,
  });

  // Mutation לאישור מועד חלופי
  const confirmRescheduleMutation = useMutation({
    mutationFn: (appointmentId: string) => 
      appointmentsService.confirmReschedule(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setConfirmSuccess(true);
      setSearchParams({});
      setTimeout(() => setConfirmSuccess(false), 5000);
    },
  });

  // טיפול באישור מועד חלופי מהמייל
  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    
    if (action === 'confirm' && id) {
      confirmRescheduleMutation.mutate(id);
    }
  }, [searchParams]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ממתינה' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'מאושרת' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'נדחתה' },
      RESCHEDULE_REQUESTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'הצעת מועד חלופי' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">הפגישות שלי</h1>

      {confirmSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          ✓ המועד החלופי אושר בהצלחה! הפגישה עודכנה.
        </div>
      )}

      {confirmRescheduleMutation.isError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          שגיאה באישור המועד החלופי. נסה שוב.
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין פגישות קרובות</h2>
          <p className="text-gray-600 mb-6">
            טרם ביקשת פגישות להצגת נכסים. חפש נכסים שמעניינים אותך ובקש פגישה!
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            חזרה לדף הבית
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment: any) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {appointment.ad.title}
                    </h3>
                    {getStatusBadge(appointment.status)}
                  </div>
                  
                  <p className="text-gray-600 mb-1">
                    <strong>כתובת:</strong> {appointment.ad.address || 'לא צוינה'}
                  </p>
                  
                  <p className="text-gray-600 mb-1">
                    <strong>תאריך ושעה:</strong> {formatDate(appointment.date)}
                  </p>
                  
                  {appointment.note && (
                    <p className="text-gray-600 mb-1">
                      <strong>הערה:</strong> {appointment.note}
                    </p>
                  )}
                  
                  <p className="text-gray-600">
                    <strong>בעל הנכס:</strong> {appointment.owner?.name || 'לא צוין'}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to={`/ads/${appointment.ad.id}`}
                    className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition text-center"
                  >
                    צפה במודעה
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
