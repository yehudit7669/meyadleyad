import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Search,
  MessageSquare,
  Mail,
  User,
  Clock,
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Conversation {
  id: string;
  userId?: string;
  guestEmail?: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  _count: {
    messages: number;
  };
}

const AdminConversations: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchConversations();
  }, [page, statusFilter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      
      if (search) {
        params.search = search;
      }

      const response = await api.get<{ success: boolean; data: any }>('/admin/conversations', { params });
      
      if (response.data.success) {
        setConversations(response.data.data.conversations);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchConversations();
  };

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.user) {
      return conversation.user.name || conversation.user.email;
    }
    return conversation.guestEmail || 'אורח';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'OPEN') {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">פתוח</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">סגור</span>;
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2 space-x-reverse">
          <MessageSquare className="w-7 h-7 text-[#C9A24D]" />
          <span>הודעות משתמשים</span>
        </h1>
        <p className="text-gray-600 mt-1">ניהול פניות ושאלות מהמשתמשים</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש לפי אימייל, שם משתמש או תוכן..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
            >
              <option value="ALL">הכל</option>
              <option value="OPEN">פתוחות</option>
              <option value="CLOSED">סגורות</option>
            </select>
            <button
              onClick={() => fetchConversations()}
              className="p-2 text-gray-600 hover:text-[#C9A24D] transition"
              title="רענן"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A24D]" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין שיחות</h3>
          <p className="text-gray-600">לא נמצאו שיחות התואמות את הסינון</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => navigate(`/admin/conversations/${conversation.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 space-x-reverse flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {conversation.user?.avatar ? (
                          <img
                            src={conversation.user.avatar}
                            alt={getDisplayName(conversation)}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#C9A24D] flex items-center justify-center text-white font-bold">
                            {getDisplayName(conversation).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {getDisplayName(conversation)}
                          </h3>
                          <div title={conversation.user ? "משתמש רשום" : "אורח"}>
                            {conversation.user ? (
                              <User className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Mail className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          {getStatusBadge(conversation.status)}
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conversation.lastMessagePreview || 'אין הודעות'}
                        </p>

                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                          <span className="flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(conversation.lastMessageAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                            </span>
                          </span>
                          <span>{conversation._count.messages} הודעות</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 space-x-reverse mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                הקודם
              </button>
              <span className="text-sm text-gray-600">
                עמוד {page} מתוך {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                הבא
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminConversations;
