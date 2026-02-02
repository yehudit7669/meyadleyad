import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, pendingApprovalsService } from '../services/api';
import { Link } from 'react-router-dom';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, _setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'approvals'>('users');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
  });

  const { data: userDetails } = useQuery({
    queryKey: ['admin-user-details', selectedUser?.id],
    queryFn: () => (selectedUser ? adminService.getUserDetails(selectedUser.id) : null),
    enabled: !!selectedUser,
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      (adminService as any).updateUser(userId, { isAdmin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => (adminService as any).deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // @ts-expect-error - Mutation for future use
  const _updateMeetingAccess = useMutation({
    mutationFn: ({ userId, blocked, reason }: any) => (adminService as any).updateMeetingAccess(userId, blocked, reason),
  });

  const handleExport = async () => {
    const blob = await (adminService as any).exportUsers() as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // וודא ש-users הוא מערך
  const users = Array.isArray(usersData) ? usersData : [];

  const filteredUsers = users.filter(
    (user: any) =>
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin" className="text-blue-600 hover:underline text-sm">
              ← חזרה לניהול
            </Link>
            <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                משתמשים
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition ${
                  activeTab === 'approvals'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                בקשות משתמשים
              </button>
            </div>
          </div>

          {activeTab === 'users' ? (
            <>
              {/* כפתור ייצוא משתמשים */}
              <button
                onClick={handleExport}
                className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                ייצוא משתמשים
              </button>

          {/* חיפוש */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <input
              type="text"
              placeholder="חפש משתמש לפי שם או אימייל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* טבלת משתמשים */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">שם</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">אימייל</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">טלפון</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                    מס' מודעות
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">תאריך הצטרפות</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">סטטוס</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.isAdmin && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                            מנהל
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {user._count?.Ad || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4">
                      {user.emailVerified ? (
                        <span className="text-green-600 text-sm">✓ מאומת</span>
                      ) : (
                        <span className="text-red-600 text-sm">✗ לא מאומת</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            toggleAdminMutation.mutate({
                              userId: user.id,
                              isAdmin: !user.isAdmin,
                            })
                          }
                          className={`px-3 py-1 text-sm rounded-lg transition ${
                            user.isAdmin
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {user.isAdmin ? 'הסר מנהל' : 'הפוך למנהל'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`האם למחוק את המשתמש ${user.name || user.email}?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? 'לא נמצאו משתמשים התואמים לחיפוש' : 'לא נמצאו משתמשים'}
              </div>
            )}
          </div>

          {/* סטטיסטיקות */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">סה"כ משתמשים</div>
              <div className="text-3xl font-bold text-blue-600">{users.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">מנהלים</div>
              <div className="text-3xl font-bold text-purple-600">
                {users.filter((u: any) => u.isAdmin).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-600 mb-1">מאומתים</div>
              <div className="text-3xl font-bold text-green-600">
                {users.filter((u: any) => u.emailVerified).length}
              </div>
            </div>
          </div>

          {/* מודעות משתמש */}
          {selectedUser && userDetails && (
            <div className="mt-8 p-4 bg-gray-50 rounded">
              <h2 className="text-xl font-bold mb-2">מודעות של {userDetails.name}</h2>
              <ul>
                {userDetails.ads?.map((ad: any) => (
                  <li key={ad.id}>{ad.title} ({ad.views} צפיות)</li>
                ))}
              </ul>
            </div>
          )}
            </>
          ) : (
            <PendingApprovalsTab />
          )}
        </div>
      </div>
  );
}

// Component for pending approvals tab
function PendingApprovalsTab() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['pending-approvals', filterStatus],
    queryFn: () => pendingApprovalsService.getAll(filterStatus === 'ALL' ? {} : { status: filterStatus }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      pendingApprovalsService.approve(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      setSelectedApproval(null);
      setAdminNotes('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      pendingApprovalsService.reject(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      setSelectedApproval(null);
      setAdminNotes('');
    },
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      OFFICE_ADDRESS_UPDATE: 'עריכת כתובת משרד',
      ABOUT_UPDATE: 'עריכת אודות',
      LOGO_UPLOAD: 'הוספת לוגו',
      BUSINESS_DESCRIPTION: 'אודות העסק',
      IMPORT_PERMISSION: 'אישור העלאת נכסים',
      ACCOUNT_DELETION: 'בקשת הסרה מלאה',
      HIGHLIGHT_AD: 'בקשה להבליט מודעה',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ממתין' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'אושר' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'נדחה' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            הכל
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ממתין
          </button>
          <button
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'APPROVED' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            אושר
          </button>
          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'REJECTED' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            נדחה
          </button>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">סוג בקשה</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">מבקש</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">תאריך</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">סטטוס</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {approvals?.map((approval: any) => (
              <tr key={approval.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{getTypeLabel(approval.type)}</div>
                  {approval.reason && (
                    <div className="text-sm text-gray-500 mt-1">{approval.reason}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{approval.user.name || approval.user.email}</div>
                  <div className="text-sm text-gray-500">{approval.user.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(approval.createdAt).toLocaleDateString('he-IL')}
                </td>
                <td className="px-6 py-4">{getStatusBadge(approval.status)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedApproval(approval)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    פרטים
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!approvals || approvals.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו בקשות
          </div>
        )}
      </div>

      {/* Approval Details Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">פרטי בקשה</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">סוג בקשה</label>
                <p className="text-gray-900">{getTypeLabel(selectedApproval.type)}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">מבקש</label>
                <p className="text-gray-900">
                  {selectedApproval.user.name || selectedApproval.user.email}
                </p>
                <p className="text-sm text-gray-500">{selectedApproval.user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">סטטוס</label>
                {getStatusBadge(selectedApproval.status)}
              </div>

              {selectedApproval.reason && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">סיבת הבקשה</label>
                  <p className="text-gray-900">{selectedApproval.reason}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">מידע מבוקש</label>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto" dir="ltr">
                  {JSON.stringify(selectedApproval.requestData, null, 2)}
                </pre>
              </div>

              {selectedApproval.oldData && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">מידע קודם</label>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto" dir="ltr">
                    {JSON.stringify(selectedApproval.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedApproval.reviewedAt && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">נבדק על ידי</label>
                    <p className="text-gray-900">{selectedApproval.reviewer?.name || 'לא ידוע'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">תאריך ביקורת</label>
                    <p className="text-gray-900">
                      {new Date(selectedApproval.reviewedAt).toLocaleString('he-IL')}
                    </p>
                  </div>

                  {selectedApproval.adminNotes && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">הערות אדמין</label>
                      <p className="text-gray-900">{selectedApproval.adminNotes}</p>
                    </div>
                  )}
                </>
              )}

              {selectedApproval.status === 'PENDING' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">הערות אדמין (אופציונלי)</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="הוסף הערות..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selectedApproval.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      if (confirm('האם לאשר בקשה זו?')) {
                        approveMutation.mutate({ id: selectedApproval.id, notes: adminNotes });
                      }
                    }}
                    disabled={approveMutation.isPending}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    {approveMutation.isPending ? 'מאשר...' : 'אשר בקשה'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('האם לדחות בקשה זו?')) {
                        rejectMutation.mutate({ id: selectedApproval.id, notes: adminNotes });
                      }
                    }}
                    disabled={rejectMutation.isPending}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                  >
                    {rejectMutation.isPending ? 'דוחה...' : 'דחה בקשה'}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setAdminNotes('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
