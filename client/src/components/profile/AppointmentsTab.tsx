import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '../../services/api';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function AppointmentsTab() {
  const queryClient = useQueryClient();
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  
  // משיכת פגישות שביקשתי
  const { data: myRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: () => appointmentsService.getMyAppointments(),
  });

  // משיכת פגישות שהגיעו אליי (כבעל נכס)
  const { data: ownerAppointments = [], isLoading: loadingOwner } = useQuery({
    queryKey: ['owner-appointments'],
    queryFn: () => appointmentsService.getOwnerAppointments(),
  });

  // איחוד כל הפגישות
  const allAppointments = [
    ...myRequests.map((apt: any) => ({ ...apt, isRequester: true })),
    ...ownerAppointments.map((apt: any) => ({ ...apt, isRequester: false })),
  ];

  const isLoading = loadingRequests || loadingOwner;

  const cancelMutation = useMutation({
    mutationFn: appointmentsService.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['owner-appointments'] });
      setCancelSuccess(true);
      setTimeout(() => setCancelSuccess(false), 3000);
    },
  });

  const approveMutation = useMutation({
    mutationFn: appointmentsService.confirmReschedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['owner-appointments'] });
      alert('הפגישה אושרה בהצלחה!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה באישור הפגישה');
    },
  });

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, newDateTime, isOwner }: { id: string; newDateTime: string; isOwner: boolean }) => {
      if (isOwner) {
        // אם אני בעל הנכס - להשתמש ב-ownerAction
        return appointmentsService.ownerAction({
          appointmentId: id,
          action: 'RESCHEDULE',
          newDate: newDateTime,
          reason: 'הצעת מועד חלופי',
        });
      } else {
        // אם אני המבקש - ליצור בקשה חדשה
        return appointmentsService.requestAppointment({
          adId: selectedAppointment.ad.id,
          date: newDateTime,
          note: `הצעת מועד חלופי לפגישה ${id}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['owner-appointments'] });
      setShowRescheduleModal(false);
      setNewDate('');
      setNewTime('');
      alert('הצעת המועד החלופי נשלחה בהצלחה!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בהצעת מועד חלופי');
    },
  });

  console.log('My requests:', myRequests);
  console.log('Owner appointments:', ownerAppointments);
  console.log('All appointments:', allAppointments);
  console.log('Is loading:', isLoading);

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

  if (!allAppointments || allAppointments.length === 0) {
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
        <p className="text-sm text-gray-600">תיאומים שנקבעו דרך האתר ({allAppointments.length})</p>
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
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תפקיד</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תאריך ושעה</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">נכס</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">כתובת</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">הערות</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allAppointments.map((apt: any) => (
              <tr key={apt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${apt.isRequester ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {apt.isRequester ? 'מבקש' : 'מארח'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div>
                    {apt.status === 'RESCHEDULE_REQUESTED' && apt.proposedDate && (
                      <div className="text-xs text-gray-500 line-through mb-1">{formatDate(apt.date)}</div>
                    )}
                    <div className={apt.status === 'RESCHEDULE_REQUESTED' && apt.proposedDate ? 'text-green-600 font-semibold' : ''}>
                      {apt.status === 'RESCHEDULE_REQUESTED' && apt.proposedDate ? formatDate(apt.proposedDate) : formatDate(apt.date)}
                    </div>
                    {apt.status === 'RESCHEDULE_REQUESTED' && apt.proposedDate && (
                      <div className="text-xs text-green-600">מועד מוצע חדש</div>
                    )}
                  </div>
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
                  <div className="flex gap-2 flex-wrap">
                    <Link
                      to={`/ads/${apt.ad.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      צפה בנכס
                    </Link>
                    {apt.status === 'RESCHEDULE_REQUESTED' && (
                      <button
                        onClick={() => approveMutation.mutate(apt.id)}
                        disabled={approveMutation.isPending}
                        className="text-green-600 hover:text-green-700 text-sm disabled:opacity-50"
                      >
                        אשר
                      </button>
                    )}
                    {(apt.status === 'PENDING' || apt.status === 'RESCHEDULE_REQUESTED') && (
                      <button
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowRescheduleModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-700 text-sm"
                      >
                        מועד חלופי
                      </button>
                    )}
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
        {allAppointments.map((apt: any) => (
          <div key={apt.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${apt.isRequester ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {apt.isRequester ? 'מבקש' : 'מארח'}
                  </span>
                  {getStatusBadge(apt.status)}
                </div>
                <div className="font-semibold text-gray-900">
                  {apt.ad.title}
                </div>
                <div className="text-sm text-gray-600">{apt.ad.address || '-'}</div>
              </div>
            </div>
            
            <div className="text-sm mb-2">
              {apt.status === 'RESCHEDULE_REQUESTED' && apt.proposedDate ? (
                <div>
                  <div className="text-gray-500 line-through text-xs mb-1">📅 {formatDate(apt.date)}</div>
                  <div className="text-green-600 font-semibold">📅 {formatDate(apt.proposedDate)}</div>
                  <div className="text-xs text-green-600">מועד מוצע חדש</div>
                </div>
              ) : (
                <div className="text-gray-600">📅 {formatDate(apt.date)}</div>
              )}
            </div>

            {apt.note && (
              <div className="text-sm text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                💬 {apt.note}
              </div>
            )}

            <div className="flex flex-col gap-2">
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
              {apt.status === 'RESCHEDULE_REQUESTED' && (
                <button
                  onClick={() => approveMutation.mutate(apt.id)}
                  disabled={approveMutation.isPending}
                  className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {approveMutation.isPending ? 'מאשר...' : 'אשר מועד חדש'}
                </button>
              )}
              {(apt.status === 'PENDING' || apt.status === 'RESCHEDULE_REQUESTED') && (
                <button
                  onClick={() => {
                    setSelectedAppointment(apt);
                    setShowRescheduleModal(true);
                  }}
                  className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  הצע מועד חלופי
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">הצע מועד חלופי</h2>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setNewDate('');
                  setNewTime('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                נכס: {selectedAppointment.ad.title}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                מועד נוכחי: {formatDate(selectedAppointment.date)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך חדש
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שעה חדשה
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!newDate || !newTime) {
                      alert('נא למלא תאריך ושעה');
                      return;
                    }
                    const [hours, minutes] = newTime.split(':').map(Number);
                    const dateTime = new Date(newDate);
                    dateTime.setHours(hours, minutes, 0, 0);
                    requestRescheduleMutation.mutate({
                      id: selectedAppointment.id,
                      newDateTime: dateTime.toISOString(),
                      isOwner: !selectedAppointment.isRequester, // אם זה לא מבקש, אז זה מארח (בעל נכס)
                    });
                  }}
                  disabled={requestRescheduleMutation.isPending}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {requestRescheduleMutation.isPending ? 'שולח...' : 'שלח הצעה'}
                </button>
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setNewDate('');
                    setNewTime('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
