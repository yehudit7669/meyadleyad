import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '../../services/api';
import { Link } from 'react-router-dom';
import { useDialogA11y } from '../../hooks/useDialogA11y';

export default function OwnerAppointments() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    appointment: any;
    action: 'APPROVE' | 'REJECT' | 'RESCHEDULE' | null;
    newDate?: string;
    reason?: string;
  }>({
    open: false,
    appointment: null,
    action: null,
  });

  const { dialogRef } = useDialogA11y({ 
    isOpen: actionModal.open, 
    onClose: () => setActionModal({ open: false, appointment: null, action: null }) 
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['owner-appointments', filterStatus],
    queryFn: () => appointmentsService.getOwnerAppointments(filterStatus || undefined),
  });

  const actionMutation = useMutation({
    mutationFn: appointmentsService.ownerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-appointments'] });
      setActionModal({ open: false, appointment: null, action: null });
    },
  });

  const handleAction = (appointment: any, action: 'APPROVE' | 'REJECT' | 'RESCHEDULE') => {
    setActionModal({
      open: true,
      appointment,
      action,
    });
  };

  const confirmAction = () => {
    if (!actionModal.appointment || !actionModal.action) return;

    actionMutation.mutate({
      appointmentId: actionModal.appointment.id,
      action: actionModal.action,
      newDate: actionModal.newDate,
      reason: actionModal.reason,
    });
  };

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
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ניהול פגישות לנכסים שלי</h1>

      {/* סינון */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          הכל
        </button>
        <button
          onClick={() => setFilterStatus('PENDING')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'PENDING'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          ממתינות
        </button>
        <button
          onClick={() => setFilterStatus('APPROVED')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterStatus === 'APPROVED'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          מאושרות
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">אין בקשות פגישות</h2>
          <p className="text-gray-600">טרם קיבלת בקשות פגישות לנכסים שלך.</p>
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
                    <strong>מבקש:</strong> {appointment.requester?.name || appointment.requester?.email}
                  </p>

                  {appointment.requester?.phone && (
                    <p className="text-gray-600 mb-1">
                      <strong>טלפון:</strong>{' '}
                      <a href={`tel:${appointment.requester.phone}`} className="text-blue-600 hover:underline">
                        {appointment.requester.phone}
                      </a>
                    </p>
                  )}

                  <p className="text-gray-600 mb-1">
                    <strong>תאריך ושעה:</strong> {formatDate(appointment.date)}
                  </p>

                  {appointment.note && (
                    <p className="text-gray-600 mb-1">
                      <strong>הערה:</strong> {appointment.note}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {appointment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(appointment, 'APPROVE')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
                      >
                        ✓ אשר פגישה
                      </button>
                      <button
                        onClick={() => handleAction(appointment, 'RESCHEDULE')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        📅 הצע מועד אחר
                      </button>
                      <button
                        onClick={() => handleAction(appointment, 'REJECT')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                      >
                        ✗ דחה
                      </button>
                    </>
                  )}
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

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="action-modal-title"
            className="bg-white rounded-lg p-6 max-w-md w-full" 
            dir="rtl"
          >
            <h2 id="action-modal-title" className="text-2xl font-bold text-gray-900 mb-4">
              {actionModal.action === 'APPROVE' && 'אישור פגישה'}
              {actionModal.action === 'REJECT' && 'דחיית פגישה'}
              {actionModal.action === 'RESCHEDULE' && 'הצעת מועד חלופי'}
            </h2>

            {actionModal.action === 'RESCHEDULE' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך ושעה חדשים
                </label>
                <input
                  type="datetime-local"
                  value={actionModal.newDate || ''}
                  onChange={(e) =>
                    setActionModal({ ...actionModal, newDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {actionModal.action === 'REJECT' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיבה (אופציונלי)
                </label>
                <textarea
                  value={actionModal.reason || ''}
                  onChange={(e) =>
                    setActionModal({ ...actionModal, reason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="למה אתה דוחה את הפגישה?"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirmAction}
                disabled={actionMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {actionMutation.isPending ? 'מבצע...' : 'אישור'}
              </button>
              <button
                onClick={() => setActionModal({ open: false, appointment: null, action: null })}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                ביטול
              </button>
            </div>

            {actionMutation.isError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {(actionMutation.error as any)?.response?.data?.message || 'אירעה שגיאה'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
