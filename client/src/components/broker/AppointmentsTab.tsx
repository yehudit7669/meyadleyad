import React from 'react';
import { useBrokerAppointments, useRespondToAppointment } from '../../hooks/useBroker';

const AppointmentsTab: React.FC = () => {
  const { data: appointments = [], isLoading } = useBrokerAppointments();
  const respondToAppointment = useRespondToAppointment();

  const handleRespond = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await respondToAppointment.mutateAsync({ id, data: { status } });
  };

  if (isLoading) {
    return <div className="text-center py-8">טוען פגישות...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">יומן פגישות</h2>

      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">אין בקשות פגישה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment: any) => (
            <div
              key={appointment.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {appointment.ad.title} (#{appointment.ad.adNumber})
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {appointment.requester.name || appointment.requester.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    📞 {appointment.requester.phone || 'לא צוין'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    📅 {new Date(appointment.date).toLocaleString('he-IL')}
                  </p>
                  {appointment.note && (
                    <p className="text-sm text-gray-600 mt-2">
                      💬 {appointment.note}
                    </p>
                  )}
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      appointment.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {appointment.status === 'APPROVED' && 'אושרה'}
                    {appointment.status === 'REJECTED' && 'נדחתה'}
                    {appointment.status === 'PENDING' && 'ממתינה'}
                  </span>
                </div>
              </div>
              {appointment.status === 'PENDING' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleRespond(appointment.id, 'APPROVED')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    אשר
                  </button>
                  <button
                    onClick={() => handleRespond(appointment.id, 'REJECTED')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    דחה
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;