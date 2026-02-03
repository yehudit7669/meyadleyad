import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ArrowRight,
  Send,
  User,
  Mail,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAdminNotifications } from '../../contexts/AdminNotificationsContext';

interface Message {
  id: string;
  senderType: 'USER' | 'ADMIN' | 'GUEST';
  body: string;
  createdAt: string;
  emailDeliveryStatus?: string;
}

interface Conversation {
  id: string;
  userId?: string;
  guestEmail?: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  };
  messages: Message[];
}

const AdminConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { refetch } = useAdminNotifications();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchConversation();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: any }>(`/admin/conversations/${id}`);
      
      if (response.data.success) {
        setConversation(response.data.data);
        // Mark as read - wait for completion
        await api.post(`/admin/conversations/${id}/read`);
        // Immediately refresh count after DB update
        await refetch();
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim() || !id) return;

    try {
      setSending(true);
      const response = await api.post<{ success: boolean; data: any }>(`/admin/conversations/${id}/messages`, {
        body: replyMessage.trim(),
      });

      if (response.data.success) {
        setReplyMessage('');
        // fetchConversation will mark as read and refresh count automatically
        await fetchConversation();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('שגיאה בשליחת ההודעה');
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!id || !confirm('האם לסגור את השיחה?')) return;

    try {
      await api.post(`/admin/conversations/${id}/close`);
      await fetchConversation();
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('שגיאה בסגירת השיחה');
    }
  };

  const handleReopenConversation = async () => {
    if (!id) return;

    try {
      await api.post(`/admin/conversations/${id}/reopen`);
      await fetchConversation();
    } catch (error) {
      console.error('Error reopening conversation:', error);
      alert('שגיאה בפתיחת השיחה');
    }
  };

  const getDisplayName = () => {
    if (!conversation) return '';
    if (conversation.user) {
      return conversation.user.name || conversation.user.email;
    }
    return conversation.guestEmail || 'אורח';
  };

  const getSenderIcon = (senderType: string) => {
    if (senderType === 'ADMIN') {
      return <Shield className="w-4 h-4 text-blue-600" />;
    }
    if (senderType === 'USER') {
      return <User className="w-4 h-4 text-green-600" />;
    }
    return <Mail className="w-4 h-4 text-gray-600" />;
  };

  const getEmailStatusIcon = (status?: string) => {
    if (status === 'SENT') {
      return (
        <div title="נשלח במייל">
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
      );
    }
    if (status === 'FAILED') {
      return (
        <div title="שליחת מייל נכשלה">
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
      );
    }
    if (status === 'PENDING') {
      return (
        <div title="ממתין לשליחה במייל">
          <Clock className="w-4 h-4 text-yellow-500" />
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A24D]" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">שיחה לא נמצאה</h2>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={() => navigate('/admin/conversations')}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            {conversation.user?.avatar ? (
              <img
                src={conversation.user.avatar}
                alt={getDisplayName()}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#C9A24D] flex items-center justify-center text-white font-bold">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{getDisplayName()}</h2>
              <p className="text-xs text-gray-500">
                {conversation.user ? (
                  <span className="flex items-center space-x-1 space-x-reverse">
                    <User className="w-3 h-3" />
                    <span>משתמש רשום</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 space-x-reverse">
                    <Mail className="w-3 h-3" />
                    <span>אורח</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {conversation.status === 'OPEN' ? (
            <>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                פתוח
              </span>
              <button
                onClick={handleCloseConversation}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                סגור שיחה
              </button>
            </>
          ) : (
            <>
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                סגור
              </span>
              <button
                onClick={handleReopenConversation}
                className="px-4 py-2 text-sm bg-[#C9A24D] text-white rounded-lg hover:bg-[#B08C3C] transition"
              >
                פתח מחדש
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((message) => {
          const isAdmin = message.senderType === 'ADMIN';
          
          return (
            <div
              key={message.id}
              className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[70%] ${isAdmin ? 'bg-blue-50' : 'bg-green-50'} rounded-lg p-4`}>
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  {getSenderIcon(message.senderType)}
                  <span className="text-xs font-semibold text-gray-700">
                    {isAdmin ? 'תמיכה' : getDisplayName()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </span>
                  {message.emailDeliveryStatus && getEmailStatusIcon(message.emailDeliveryStatus)}
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Form */}
      {conversation.status === 'OPEN' && (
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendReply} className="flex items-end space-x-4 space-x-reverse">
            <div className="flex-1">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="כתוב תשובה..."
                rows={3}
                maxLength={2000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 mt-1 text-left">
                {replyMessage.length}/2000
              </div>
            </div>
            <button
              type="submit"
              disabled={sending || !replyMessage.trim()}
              className="px-6 py-3 bg-[#C9A24D] text-white rounded-lg font-semibold hover:bg-[#B08C3C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>שלח</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminConversationDetail;
