import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersAdminService, type GetUsersParams } from '../../services/users-admin.service';
import { useAuth } from '../../hooks/useAuth';
import { useEmailPermissions } from '../../hooks/useEmailPermissions';

export default function UsersManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = useEmailPermissions();
  const [filters, setFilters] = useState<GetUsersParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: '',
    name: '',
    phone: '',
    role: 'USER',
    password: '',
  });

  // Check permissions
  const canSearchByEmail = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isModerator = user?.role === 'MODERATOR';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canExportUsers = hasPermission('export_users');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => usersAdminService.getUsers(filters),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const searchBy = formData.get('searchBy') as 'name' | 'email' | 'id';

    // Prevent Moderator from searching by email
    if (isModerator && searchBy === 'email') {
      alert('אין הרשאה לחפש לפי אימייל');
      return;
    }

    setFilters((prev) => ({ ...prev, q, searchBy, page: 1 }));
  };

  const handleFilterChange = (key: keyof GetUsersParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (sortBy: GetUsersParams['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortDir: prev.sortBy === sortBy && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Export with current filters (without pagination)
      const exportFilters = { ...filters };
      delete exportFilters.page;
      delete exportFilters.limit;
      
      await usersAdminService.exportUsers(exportFilters);
      alert('הקובץ הורד בהצלחה!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'שגיאה בייצוא משתמשים');
    } finally {
      setIsExporting(false);
    }
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: usersAdminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateModal(false);
      setCreateFormData({
        email: '',
        name: '',
        phone: '',
        role: 'USER',
        password: '',
      });
      alert('המשתמש נוצר בהצלחה!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה ביצירת משתמש');
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PARTIAL_BLOCK':
        return 'bg-yellow-100 text-yellow-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'פעיל';
      case 'PARTIAL_BLOCK':
        return 'חסום חלקית';
      case 'BLOCKED':
        return 'חסום';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">שגיאה בטעינת משתמשים</div>
      </div>
    );
  }

  const users = (data as any)?.data?.users || [];
  const pagination = (data as any)?.data?.pagination || {};

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים</h1>
          <p className="mt-2 text-sm text-gray-600">
            ניהול משתמשי המערכת, הרשאות וחסימות
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            צור משתמש חדש
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <input
                type="text"
                name="q"
                placeholder="חיפוש..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search By */}
            <div>
              <select
                name="searchBy"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue="name"
              >
                <option value="name">חיפוש לפי שם</option>
                {canSearchByEmail && <option value="email">חיפוש לפי אימייל</option>}
                <option value="id">חיפוש לפי מזהה</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Role Filter */}
            <div>
              <select
                value={filters.roleType || ''}
                onChange={(e) => handleFilterChange('roleType', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">כל סוגי המשתמשים</option>
                <option value="USER">משתמש פרטי</option>
                <option value="BROKER">מתווך</option>
                <option value="SERVICE_PROVIDER">נותן שירות</option>
                <option value="ADMIN">מנהל</option>
                <option value="SUPER_ADMIN">מנהל על</option>
                <option value="MODERATOR">מנהל צופה</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">כל הסטטוסים</option>
                <option value="ACTIVE">פעיל</option>
                <option value="PARTIAL_BLOCK">חסום חלקית</option>
                <option value="BLOCKED">חסום</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="מתאריך"
              />
            </div>

            {/* Date To */}
            <div>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="עד תאריך"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                חיפוש
              </button>

              <button
                type="button"
                onClick={() => setFilters({ page: 1, limit: 20, sortBy: 'createdAt', sortDir: 'desc' })}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                נקה סינונים
              </button>
            </div>

            {canExportUsers && (
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                📊 {isExporting ? 'מייצא...' : 'ייצוא לרשימה'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  שם מלא {filters.sortBy === 'name' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  אימייל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג משתמש
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  תאריך הרשמה {filters.sortBy === 'createdAt' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('adsCount')}
                >
                  מודעות {filters.sortBy === 'adsCount' && (filters.sortDir === 'asc' ? '↑' : '↓')}
                </th>
                {!isModerator && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {canSearchByEmail ? user.email : '***'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.roleType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.adsCount}
                  </td>
                  {!isModerator && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        צפה
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הקודם
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הבא
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  מציג <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> עד{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  מתוך <span className="font-medium">{pagination.total}</span> תוצאות
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">צור משתמש חדש</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              
              if (!createFormData.email || !createFormData.password) {
                alert('אימייל וסיסמה הם שדות חובה');
                return;
              }

              if (createFormData.password.length < 6) {
                alert('הסיסמה חייבת להיות לפחות 6 תווים');
                return;
              }

              createUserMutation.mutate(createFormData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימייל *</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <input
                  type="tel"
                  value={createFormData.phone}
                  onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה *</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="לפחות 6 תווים"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד *</label>
                <select
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">משתמש פרטי</option>
                  <option value="BROKER">מתווך</option>
                  <option value="SERVICE_PROVIDER">נותן שירות</option>
                  <option value="MODERATOR">מנהל צופה</option>
                  <option value="ADMIN">מנהל</option>
                  <option value="SUPER_ADMIN">מנהל על</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  צור משתמש
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      email: '',
                      name: '',
                      phone: '',
                      role: 'USER',
                      password: '',
                    });
                  }}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
