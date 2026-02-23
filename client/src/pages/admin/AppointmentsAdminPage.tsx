import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { PROPERTY_TYPE_OPTIONS } from '../../constants/adTypes';

interface Appointment {
  id: string;
  date: string;
  status: string;
  statusReason?: string;
  note?: string;
  createdAt: string;
  ad: {
    id: string;
    title?: string;
    address?: string;
    Street?: {
      name: string;
    };
    City?: {
      name: string;
    };
    customFields?: any;
    price?: number;
  };
  requester: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  owner: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  history?: Array<{
    id: string;
    fromStatus?: string;
    toStatus: string;
    reason?: string;
    createdAt: string;
  }>;
}

export default function AppointmentsAdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Helper function to get property type label in Hebrew
  const getPropertyTypeLabel = (propertyType: string): string => {
    const option = PROPERTY_TYPE_OPTIONS.find(opt => opt.value === propertyType);
    return option ? option.label : propertyType;
  };
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'userName' | 'phone' | 'propertyAddress'>('userName');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');
  const [reason, setReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const isModerator = user?.role === 'MODERATOR';
  const canModify = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch appointments
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-appointments', page, status, searchQuery, searchBy, startDate, endDate],
    queryFn: () => adminService.getAdminAppointments({
      page,
      limit: 20,
      status: status || undefined,
      q: searchQuery || undefined,
      searchBy: searchQuery ? searchBy : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
  });

  // Fetch appointment details
  const { data: detailsData, isLoading: loadingDetails } = useQuery<Appointment>({
    queryKey: ['admin-appointment-details', selectedAppointment?.id],
    queryFn: () => adminService.getAdminAppointmentById(selectedAppointment!.id) as Promise<Appointment>,
    enabled: !!selectedAppointment && showDetails,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminService.updateAppointmentStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-details'] });
      setShowStatusModal(false);
      setReason('');
      setStatusToUpdate('');
      if (showDetails && selectedAppointment) {
        // Refresh details
        queryClient.invalidateQueries({ queryKey: ['admin-appointment-details', selectedAppointment.id] });
      }
    },
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.cancelAdminAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointment-details'] });
      setShowStatusModal(false);
      setReason('');
    },
  });

  const handleViewDetails = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  const handleUpdateStatus = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setStatusToUpdate(appointment.status);
    setReason('');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = () => {
    if (!selectedAppointment) return;

    if ((statusToUpdate === 'REJECTED' || statusToUpdate === 'CANCELED') && !reason.trim()) {
      alert('נא לציין סיבה לדחייה או ביטול');
      return;
    }

    if (reason && reason.length > 250) {
      alert('הסיבה חייבת להיות עד 250 תווים');
      return;
    }

    updateStatusMutation.mutate({
      id: selectedAppointment.id,
      status: statusToUpdate,
      reason: reason || undefined,
    });
  };

  // @ts-expect-error - Intentionally unused for now
  const _handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    
    if (!reason.trim()) {
      alert('נא לציין סיבה לביטול');
      return;
    }

    if (reason.length > 250) {
      alert('הסיבה חייבת להיות עד 250 תווים');
      return;
    }

    cancelMutation.mutate({
      id: selectedAppointment.id,
      reason,
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ממתין' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'מאושר' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'נדחה' },
      CANCELED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'בוטל' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'הושלם' },
      RESCHEDULE_REQUESTED: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'בקשת שינוי' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-[#1F3F3A]">תיאומי פגישות</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">חיפוש</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="הזן טקסט לחיפוש..."
            />
          </div>

          {/* Search By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">חפש לפי</label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="userName">שם משתמש</option>
              <option value="phone">טלפון</option>
              <option value="propertyAddress">כתובת נכס</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">הכל</option>
              <option value="PENDING">ממתין</option>
              <option value="APPROVED">מאושר</option>
              <option value="REJECTED">נדחה</option>
              <option value="CANCELED">בוטל</option>
              <option value="COMPLETED">הושלם</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">טווח תאריכים</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 border rounded-lg px-2 py-2 text-sm"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 border rounded-lg px-2 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          שגיאה בטעינת הפגישות
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך ושעה</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">נכס/כתובת</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מבקש הפגישה</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מפרסם/מתווך</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A24D]"></div>
                    </div>
                  </td>
                </tr>
              ) : (data as any)?.appointments?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    לא נמצאו פגישות
                  </td>
                </tr>
              ) : (
                (data as any)?.appointments?.map((appointment: Appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-black">{formatDate(appointment.date)}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      {appointment.ad.title || 
                        appointment.ad.address ||
                        `${appointment.ad.Street?.name || ''}, ${appointment.ad.City?.name || ''}`.trim()}
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      <div>
                        <div className="font-medium">{appointment.requester.name}</div>
                        {!isModerator && appointment.requester.phone && (
                          <div className="text-gray-500 text-xs">{appointment.requester.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">
                      <div>
                        <div className="font-medium">{appointment.owner.name}</div>
                        {!isModerator && appointment.owner.phone && (
                          <div className="text-gray-500 text-xs">{appointment.owner.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-black">{getStatusBadge(appointment.status)}</td>
                    <td className="px-4 py-3 text-sm text-black">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          צפייה
                        </button>
                        {canModify && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appointment)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium"
                            >
                              שינוי סטטוס
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data as any)?.pagination && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              עמוד {(data as any).pagination.page} מתוך {(data as any).pagination.totalPages} | סה"כ {(data as any).pagination.total} פגישות
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= ((data as any).pagination.totalPages || 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#1F3F3A]">פרטי פגישה</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C9A24D]"></div>
                </div>
              ) : detailsData ? (
                <div className="space-y-4">
                  {/* Property Details */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-black mb-2">פרטי הנכס</h3>
                    <p className="text-sm text-black">
                      {(detailsData as any).ad.title || 
                        (detailsData as any).ad.address ||
                        `${(detailsData as any).ad.Street?.name || ''}, ${(detailsData as any).ad.City?.name || ''}`.trim()}
                    </p>
                    {(detailsData as any).ad.customFields?.propertyType && (
                      <p className="text-sm text-black">סוג: {getPropertyTypeLabel((detailsData as any).ad.customFields.propertyType)}</p>
                    )}  
                    {(detailsData as any).ad.price && (
                      <p className="text-sm text-black">מחיר: ₪{(detailsData as any).ad.price.toLocaleString()}</p>
                    )}
                  </div>

                  {/* Appointment Details */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-black mb-2">פרטי הפגישה</h3>
                    <p className="text-sm text-black"><span className="font-medium">תאריך ושעה:</span> {formatDate((detailsData as any).date)}</p>
                    <p className="text-sm text-black"><span className="font-medium">סטטוס:</span> {getStatusBadge((detailsData as any).status)}</p>
                    {(detailsData as any).note && (
                      <p className="text-sm text-black"><span className="font-medium">הערה:</span> {(detailsData as any).note}</p>
                    )}
                    {(detailsData as any).statusReason && (
                      <p className="text-sm text-black"><span className="font-medium">סיבה:</span> {(detailsData as any).statusReason}</p>
                    )}
                  </div>

                  {/* Requester */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-black mb-2">מבקש הפגישה</h3>
                    <p className="text-sm text-black"><span className="font-medium">שם:</span> {(detailsData as any).requester.name}</p>
                    {!isModerator && (
                      <>
                        {(detailsData as any).requester.email && (
                          <p className="text-sm text-black"><span className="font-medium">אימייל:</span> {(detailsData as any).requester.email}</p>
                        )}
                        {(detailsData as any).requester.phone && (
                          <p className="text-sm text-black"><span className="font-medium">טלפון:</span> {(detailsData as any).requester.phone}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Owner */}
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-black mb-2">מפרסם/מתווך</h3>
                    <p className="text-sm text-black"><span className="font-medium">שם:</span> {(detailsData as any).owner.name}</p>
                    {!isModerator && (
                      <>
                        {(detailsData as any).owner.email && (
                          <p className="text-sm text-black"><span className="font-medium">אימייל:</span> {(detailsData as any).owner.email}</p>
                        )}
                        {(detailsData as any).owner.phone && (
                          <p className="text-sm text-black"><span className="font-medium">טלפון:</span> {(detailsData as any).owner.phone}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* History */}
                  {(detailsData as any)?.history && (detailsData as any).history?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-black mb-2">היסטוריית שינויים</h3>
                      <div className="space-y-2">
                        {(detailsData as any).history.map((h: any) => (
                          <div key={h.id} className="text-sm text-black bg-gray-50 p-2 rounded">
                            <p>
                              {h.fromStatus && `${h.fromStatus} → `}
                              <span className="font-medium">{h.toStatus}</span>
                            </p>
                            {h.reason && <p className="text-black">סיבה: {h.reason}</p>}
                            <p className="text-black text-xs">{formatDate(h.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {canModify && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowDetails(false);
                          handleUpdateStatus(detailsData as Appointment);
                        }}
                        className="flex-1 bg-[#C9A24D] text-white px-4 py-2 rounded-lg hover:bg-[#B08C3C] transition"
                      >
                        שינוי סטטוס
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#1F3F3A]">עדכון סטטוס פגישה</h2>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס חדש</label>
                <select
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="PENDING">ממתין</option>
                  <option value="APPROVED">מאושר</option>
                  <option value="REJECTED">נדחה</option>
                  <option value="CANCELED">בוטל</option>
                  <option value="COMPLETED">הושלם</option>
                </select>
              </div>

              {(statusToUpdate === 'REJECTED' || statusToUpdate === 'CANCELED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סיבה <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={250}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="נא לציין סיבה (עד 250 תווים)"
                  />
                  <div className="text-xs text-gray-500 mt-1">{reason.length}/250</div>
                </div>
              )}

              {(statusToUpdate !== 'REJECTED' && statusToUpdate !== 'CANCELED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סיבה (אופציונלי)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={250}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="הערה או סיבה (עד 250 תווים)"
                  />
                  <div className="text-xs text-gray-500 mt-1">{reason.length}/250</div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleStatusSubmit}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 bg-[#C9A24D] text-white px-4 py-2 rounded-lg hover:bg-[#B08C3C] transition disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? 'שומר...' : 'עדכן סטטוס'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  ביטול
                </button>
              </div>

              {updateStatusMutation.isError && (
                <div className="text-red-600 text-sm">
                  שגיאה בעדכון הסטטוס. אנא נסה שוב.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
