import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/api';
import { Link } from 'react-router-dom';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, _setSelectedUser] = useState<any>(null);

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
        </div>
      </div>
  );
}
