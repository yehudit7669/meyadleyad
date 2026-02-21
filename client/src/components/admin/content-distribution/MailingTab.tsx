import { useState, useEffect } from 'react';
import { Search, UserCheck, Ban } from 'lucide-react';
import { contentDistributionService, MailingSubscriber } from '../../../services/content-distribution.service';
import { useAuth } from '../../../hooks/useAuth';

type StatusFilter = 'ALL' | 'ACTIVE' | 'OPT_OUT' | 'BLOCKED';

export default function MailingTab() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<MailingSubscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<MailingSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const isReadOnly = user?.role === 'MODERATOR';

  useEffect(() => {
    loadSubscribers();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, searchTerm, statusFilter]);

  const loadSubscribers = async () => {
    try {
      setLoading(true);
      // Load weekly digest subscribers from UserPreference
      const data = await contentDistributionService.getWeeklyDigestSubscribers();
      setSubscribers(data);
    } catch (error) {
      console.error('Failed to load subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscribers = () => {
    let filtered = subscribers;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.email.toLowerCase().includes(term) ||
          (s.name && s.name.toLowerCase().includes(term))
      );
    }

    setFilteredSubscribers(filtered);
  };

  const handleUpdateStatus = async (
    id: string,
    status: 'ACTIVE' | 'OPT_OUT' | 'BLOCKED'
  ) => {
    try {
      if (status === 'BLOCKED') {
        await contentDistributionService.blockWeeklyDigestUser(id);
      } else if (status === 'ACTIVE') {
        await contentDistributionService.unblockWeeklyDigestUser(id);
      }
      await loadSubscribers();
    } catch (error) {
      console.error('Failed to update subscriber:', error);
      alert('שגיאה בעדכון המנוי');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך לחסום משתמש זה מקבלת התוכן השבועי?')) return;

    try {
      await contentDistributionService.blockWeeklyDigestUser(id);
      await loadSubscribers();
    } catch (error) {
      console.error('Failed to block subscriber:', error);
      alert('שגיאה בחסימת המשתמש');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">פעיל</span>;
      case 'BLOCKED':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">חסום</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">רשימת תפוצה - קובץ תוכן שבועי</h2>
          <p className="text-sm text-gray-600 mt-1">משתמשים שנרשמו לקבל את הקובץ השבועי דרך העדפות תקשורת בפרופיל האישי</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם או מייל..."
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">כל הסטטוסים</option>
              <option value="ACTIVE">פעילים</option>
              <option value="BLOCKED">חסומים</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {subscribers.filter((s) => s.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-500">פעילים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {subscribers.filter((s) => s.status === 'BLOCKED').length}
            </div>
            <div className="text-sm text-gray-500">חסומים</div>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                מייל
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                שם
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סטטוס
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך הוספה
              </th>
              {!isReadOnly && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'לא נמצאו מנויים התואמים לחיפוש'
                    : 'אין משתמשים שנרשמו לקבלת התוכן השבועי'}
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subscriber.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subscriber.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(subscriber.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(subscriber.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        {subscriber.status === 'BLOCKED' && (
                          <button
                            onClick={() => handleUpdateStatus(subscriber.id, 'ACTIVE')}
                            className="text-green-600 hover:text-green-800"
                            title="בטל חסימה"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {subscriber.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRemove(subscriber.id)}
                            className="text-red-600 hover:text-red-800"
                            title="חסום משתמש"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}