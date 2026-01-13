import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '../../services/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function AppointmentsTab() {
  const queryClient = useQueryClient();
  const [cancelSuccess, setCancelSuccess] = useState(false);
  
  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: appointmentsService.getMyAppointments,
  });

  const cancelMutation = useMutation({
    mutationFn: appointmentsService.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setCancelSuccess(true);
      setTimeout(() => setCancelSuccess(false), 3000);
    },
  });

  console.log('Appointments data:', appointments);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      PENDING: { text: 'ממתין לאישור', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { text: 'אושר', className: 'bg-green-100 text-green-800' },
      REJECTED: { text: 'נדחה', className: 'bg-red-100 text-red-800' },
      RESCHEDULE_REQUESTED: { text: 'הצעת מועד חלופי', className: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('he-IL', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>עדיין לא נקבעו תיאומים</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">לוח התיאומים שלי</h2>
        <p className="text-sm text-gray-600">תיאומים שנקבעו דרך האתר</p>
      </div>

      {cancelSuccess && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          ✓ הפגישה בוטלה בהצלחה
        </div>
      )}

      {cancelMutation.isError && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          שגיאה בביטול הפגישה. נסה שוב.
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תאריך ושעה</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">נכס</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">כתובת</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">הערות</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.map((apt: any) => (
              <tr key={apt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(apt.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {apt.ad.title}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {apt.ad.address || '-'}
                </td>
                <td className="px-4 py-3">{getStatusBadge(apt.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {apt.note || '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/ads/${apt.ad.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      צפה בנכס
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('האם אתה בטוח שברצונך לבטל את הפגישה?')) {
                          cancelMutation.mutate(apt.id);
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                    >
                      בטל
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {appointments.map((apt: any) => (
          <div key={apt.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {apt.ad.title}
                </div>
                <div className="text-sm text-gray-600">{apt.ad.address || '-'}</div>
              </div>
              {getStatusBadge(apt.status)}
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              📅 {formatDate(apt.date)}
            </div>

            {apt.note && (
              <div className="text-sm text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                💬 {apt.note}
              </div>
            )}

            <div className="flex gap-2">
              <Link
                to={`/ads/${apt.ad.id}`}
                className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                צפה בנכס
              </Link>
              <button
                onClick={() => {
                  if (confirm('האם אתה בטוח שברצונך לבטל את הפגישה?')) {
                    cancelMutation.mutate(apt.id);
                  }
                }}
                disabled={cancelMutation.isPending}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'מבטל...' : 'בטל'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
