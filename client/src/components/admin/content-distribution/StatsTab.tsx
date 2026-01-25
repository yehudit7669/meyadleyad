import { useState, useEffect } from 'react';
import { Download, Users, FileText, Send, TrendingUp } from 'lucide-react';
import { contentDistributionService, DistributionStats, DistributionHistory } from '../../../services/content-distribution.service';
import { useAuth } from '../../../hooks/useAuth';

export default function StatsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DistributionStats | null>(null);
  const [history, setHistory] = useState<DistributionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const canExport = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, historyData] = await Promise.all([
        contentDistributionService.getStats(),
        contentDistributionService.getDistributionHistory(20),
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await contentDistributionService.exportStats();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-distribution-stats-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export statistics:', error);
      alert('שגיאה בייצוא הסטטיסטיקות');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-red-500">שגיאה בטעינת הסטטיסטיקות</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">סטטיסטיקות</h2>
        {canExport && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'מייצא...' : 'ייצוא סטטיסטיקה'}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscribers Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-gray-500">מנויים</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats.subscribers.total}</div>
            <div className="text-sm text-gray-600">סה"כ מנויים</div>
            <div className="pt-2 border-t border-gray-200 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">פעילים:</span>
                <span className="font-semibold text-green-600">{stats.subscribers.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">הסרה עצמית:</span>
                <span className="font-semibold text-yellow-600">{stats.subscribers.optOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">חסומים:</span>
                <span className="font-semibold text-red-600">{stats.subscribers.blocked}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-gray-500">תוכן</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats.content.total}</div>
            <div className="text-sm text-gray-600">סה"כ פריטי תוכן</div>
            <div className="pt-2 border-t border-gray-200 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">פעילים:</span>
                <span className="font-semibold text-green-600">{stats.content.active}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Send className="w-8 h-8 text-green-600" />
            <span className="text-sm text-gray-500">תפוצות</span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">{stats.distributions.total}</div>
            <div className="text-sm text-gray-600">סה"כ תפוצות</div>
            <div className="pt-2 border-t border-gray-200 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">30 יום אחרונים:</span>
                <span className="font-semibold text-blue-600">{stats.distributions.last30Days}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <span className="text-sm text-gray-500">תפוצה אחרונה</span>
          </div>
          <div className="space-y-2">
            {stats.distributions.last ? (
              <>
                <div className="text-lg font-bold text-gray-900 truncate">
                  {stats.distributions.last.contentTitle}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(stats.distributions.last.date).toLocaleDateString('he-IL')}
                </div>
                <div className="pt-2 border-t border-gray-200 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">נמענים:</span>
                    <span className="font-semibold">{stats.distributions.last.totalRecipients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">הגיעו:</span>
                    <span className="font-semibold text-green-600">
                      {stats.distributions.last.recipientsReached}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-500">אין תפוצות עדיין</div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution History */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">היסטוריית תפוצות</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תוכן
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מצב תפוצה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נמענים
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  הצלחות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  כשלונות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    אין היסטוריית תפוצות
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.distributedAt).toLocaleDateString('he-IL')}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(item.distributedAt).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.contentItem.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.contentItem.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.mode === 'INITIAL'
                            ? 'bg-blue-100 text-blue-800'
                            : item.mode === 'REDISTRIBUTE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {item.mode === 'INITIAL'
                          ? 'ראשונית'
                          : item.mode === 'REDISTRIBUTE'
                          ? 'מחדש'
                          : 'דחיפה'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.recipientsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {item.successCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                      {item.failedCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
