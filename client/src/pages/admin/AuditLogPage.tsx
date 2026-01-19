import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Download,
  Filter,
  X,
  FileText,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetId?: string;
  entityType?: string;
  meta?: any;
  ip?: string;
  createdAt: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ACTION_TYPES = [
  { value: '', label: 'הכל' },
  { value: 'approve', label: 'אישור' },
  { value: 'reject', label: 'דחייה' },
  { value: 'block', label: 'חסימה' },
  { value: 'export', label: 'ייצוא' },
  { value: 'role_change', label: 'שינוי הרשאות' },
  { value: 'system_change', label: 'שינוי מערכת' },
];

const ENTITY_TYPES = [
  { value: '', label: 'הכל' },
  { value: 'user', label: 'משתמש' },
  { value: 'listing', label: 'מודעה' },
  { value: 'appointment', label: 'פגישה' },
  { value: 'file', label: 'קובץ' },
  { value: 'system', label: 'מערכת' },
];

// מיפוי פעולות ספציפיות לקטגוריות כלליות
// @ts-expect-error - Intentionally unused for now
const _mapActionToCategory = (action: string): string => {
  const actionMap: Record<string, string> = {
    // אישורים
    'approve': 'אישור',
    'approve_ad': 'אישור',
    'APPROVE_AD': 'אישור',
    
    // דחיות
    'reject': 'דחייה',
    'reject_ad': 'דחייה',
    'REJECT_AD': 'דחייה',
    
    // חסימות
    'block': 'חסימה',
    'block_user': 'חסימה',
    'unblock': 'חסימה',
    'BLOCK_USER': 'חסימה',
    'MEETINGS_BLOCK': 'חסימה',
    'ADMIN_MEETINGS_BLOCK': 'חסימה',
    'ADMIN_MEETINGS_UNBLOCK': 'חסימה',
    
    // ייצואים
    'export': 'ייצוא',
    'EXPORT_AUDIT_LOG': 'ייצוא',
    'EXPORT_USERS': 'ייצוא',
    'EXPORT_ADS': 'ייצוא',
    'export_history': 'ייצוא',
    
    // שינויי הרשאות
    'role_change': 'שינוי הרשאות',
    'ROLE_CHANGE': 'שינוי הרשאות',
    'UPDATE_USER_ROLE': 'שינוי הרשאות',
    'ADMIN_ROLE_CHANGE': 'שינוי הרשאות',
    
    // שינויי מערכת
    'system_change': 'שינוי מערכת',
    'SYSTEM_CHANGE': 'שינוי מערכת',
    'VIEW_BRANDING_SETTINGS': 'שינוי מערכת',
    'UPDATE_BRANDING': 'שינוי מערכת',
    'ADMIN_BULK_REMOVE_USER_ADS': 'שינוי מערכת',
    'CREATE_CATEGORY': 'שינוי מערכת',
    'UPDATE_CATEGORY': 'שינוי מערכת',
    'DELETE_CATEGORY': 'שינוי מערכת',
    'IMPORT_CITIES': 'שינוי מערכת',
    'IMPORT_ADS': 'שינוי מערכת',
    'UPDATE_WATERMARK_SETTINGS': 'שינוי מערכת',
    'UPLOAD_WATERMARK_LOGO': 'שינוי מערכת',
  };
  
  return actionMap[action] || action;
};

const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    adminEmail: '',
    ip: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Selected log for details
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    entityType: '',
    adminEmail: '',
    ip: '',
    search: '',
    format: 'csv',
  });
  const [exporting, setExporting] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.adminEmail) queryParams.append('adminEmail', filters.adminEmail);
      if (filters.ip) queryParams.append('ip', filters.ip);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/admin/audit-log?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'שגיאה בטעינת לוגים');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      adminEmail: '',
      ip: '',
      startDate: '',
      endDate: '',
      search: '',
    });
  };

  const handleExport = async () => {
    if (!exportFilters.startDate || !exportFilters.endDate) {
      alert('נא לבחור תאריכי התחלה וסיום');
      return;
    }

    try {
      setExporting(true);

      const response = await fetch('/api/admin/audit-log/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportFilters),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export');
      }

      if (exportFilters.format === 'csv') {
        // Download CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // JSON format
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setShowExportModal(false);
      alert('הלוגים יוצאו בהצלחה');
      
      // Refresh logs to show the export action
      fetchLogs();
    } catch (err: any) {
      console.error('Export error:', err);
      alert(err.message || 'שגיאה בייצוא הלוגים');
    } finally {
      setExporting(false);
    }
  };

  const viewLogDetails = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/audit-log/${logId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch log details');
      }

      const log = await response.json();
      setSelectedLog(log);
    } catch (err: any) {
      console.error('Error fetching log details:', err);
      alert('שגיאה בטעינת פרטי הלוג');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // @ts-expect-error - Function for future use
  const _normalizeEntityType = (entityType: string | null | undefined): string => {
    if (!entityType) return '-';
    
    const lowerType = entityType.toLowerCase();
    
    // מודעות
    if (lowerType === 'listing' || lowerType === 'ad') return 'מודעה';
    
    // משתמשים
    if (lowerType === 'user') return 'משתמש';
    
    // פגישות
    if (lowerType === 'appointment') return 'פגישה';
    
    // קבצים
    if (lowerType === 'file') return 'קובץ';
    
    // מערכת - כולל כל הערכים הרלוונטיים
    if (lowerType === 'system' || entityType === 'BrandingConfig' || 
        entityType === 'Category' || entityType === 'City' || entityType === 'Street') {
      return 'מערכת';
    }
    
    return entityType;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לוג פעולות ניהול</h1>
          <p className="text-sm text-gray-600 mt-1">
            מעקב אחר כל פעולות הניהול במערכת - Read Only
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            ייצוא לוגים
          </button>
        )}
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">מודול ביקורת קריטי</p>
          <p className="mt-1">
            כל הרשומות הן Read-Only. אסור לערוך, למחוק או להסתיר רשומות לוג.
            כל פעולת ייצוא נרשמת אוטומטית.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            סינון וחיפוש
          </h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            נקה סינונים
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מתאריך
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              עד תאריך
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג פעולה
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ACTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג ישות
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ENTITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Admin Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              משתמש מבצע (אימייל)
            </label>
            <input
              type="email"
              value={filters.adminEmail}
              onChange={(e) => handleFilterChange('adminEmail', e.target.value)}
              placeholder="הקלד אימייל..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* IP Address - Admin/SuperAdmin only */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת IP
              </label>
              <input
                type="text"
                value={filters.ip}
                onChange={(e) => handleFilterChange('ip', e.target.value)}
                placeholder="192.168.1.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Free Text Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              חיפוש חופשי (פעולה, מזהה ישות, הערות)
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="חיפוש טקסטואלי..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              נסה שוב
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">לא נמצאו רשומות לוג</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      תאריך ושעה
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      משתמש מבצע
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      תפקיד במערכת
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      סוג פעולה
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      ישות מושפעת
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      מזהה ישות
                    </th>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        כתובת IP
                      </th>
                    )}
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      מקור הרשאה
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => viewLogDetails(log.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.admin?.name || 'לא ידוע'}</div>
                          <div className="text-xs text-gray-500">{log.admin?.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3" />
                          {log.admin?.role || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.entityType || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {log.targetId ? log.targetId.substring(0, 8) + '...' : '-'}
                      </td>
                      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {log.ip || '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Role
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                מציג {((pagination.page - 1) * pagination.limit) + 1} עד{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} מתוך{' '}
                {pagination.total} רשומות
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הקודם
                </button>
                <div className="flex items-center gap-2 px-3">
                  עמוד {pagination.page} מתוך {pagination.totalPages}
                </div>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הבא
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">פרטי רשומת לוג</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">מזהה</label>
                  <p className="text-sm text-gray-900 font-mono mt-1">{selectedLog.id}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">תאריך ושעה</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(selectedLog.createdAt)}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">שם מנהל</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.admin?.name || 'לא ידוע'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">אימייל מנהל</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.admin?.email || 'לא ידוע'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">תפקיד</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.admin?.role || '-'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">סוג פעולה</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.action}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">סוג ישות</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.entityType || '-'}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">מזהה ישות</label>
                  <p className="text-sm text-gray-900 font-mono mt-1">{selectedLog.targetId || '-'}</p>
                </div>

                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && selectedLog.ip && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">כתובת IP</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">{selectedLog.ip}</p>
                  </div>
                )}
              </div>

              {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase block mb-2">
                    Metadata (JSON)
                  </label>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto border border-gray-200 text-black">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                <strong>הערה:</strong> כל הנתונים הם Read-Only. אין אפשרות לערוך או למחוק רשומות לוג.
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">ייצוא לוגים</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <strong>שים לב:</strong> פעולת הייצוא תתועד אוטומטית בלוג.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מתאריך <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={exportFilters.startDate}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  עד תאריך <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={exportFilters.endDate}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג פעולה (אופציונלי)
                </label>
                <select
                  value={exportFilters.action}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג ישות (אופציונלי)
                </label>
                <select
                  value={exportFilters.entityType}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, entityType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ENTITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  משתמש מבצע (אופציונלי)
                </label>
                <input
                  type="email"
                  value={exportFilters.adminEmail}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="אימייל המנהל"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כתובת IP (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={exportFilters.ip}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, ip: e.target.value }))}
                    placeholder="192.168.1.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  חיפוש חופשי (אופציונלי)
                </label>
                <input
                  type="text"
                  value={exportFilters.search}
                  onChange={(e) => setExportFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="חיפוש בפעולה, מזהה ישות..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  פורמט
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFilters.format === 'csv'}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, format: e.target.value }))}
                      className="ml-2"
                    />
                    CSV
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFilters.format === 'json'}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, format: e.target.value }))}
                      className="ml-2"
                    />
                    JSON
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={exporting}
              >
                ביטול
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || !exportFilters.startDate || !exportFilters.endDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    מייצא...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    ייצא
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
