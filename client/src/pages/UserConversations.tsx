import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  MessageCircle,
  ArrowRight,
  Send,
  Loader2,
  Clock,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useUserNotifications } from '../contexts/UserNotificationsContext';

interface Message {
  id: string;
  senderType: 'USER' | 'ADMIN' | 'GUEST';
  body: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
  userLastReadAt?: string;
  messages: Message[];
  _count: {
    messages: number;
  };
}

const UserConversations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { refreshCount } = useUserNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ success: boolean; data: any }>('/me/conversations');
      
      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetail = async (id: string) => {
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/me/conversations/${id}`);
      
      if (response.data.success) {
        setSelectedConversation(response.data.data);
        // Mark as read - wait for completion
        await api.post(`/me/conversations/${id}/read`);
        // Immediately refresh count and list after DB update
        await refreshCount();
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error fetching conversation detail:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await api.post<{ success: boolean; data: any }>(`/me/conversations/${selectedConversation.id}/messages`, {
        body: replyMessage.trim(),
      });

      if (response.data.success) {
        setReplyMessage('');
        await fetchConversationDetail(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('שגיאה בשליחת ההודעה');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">נדרשת התחברות</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#C9A24D] text-white px-6 py-2 rounded-lg hover:bg-[#B08C3C] transition"
          >
            התחבר
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A24D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2 space-x-reverse">
            <MessageCircle className="w-7 h-7 text-[#C9A24D]" />
            <span>ההודעות שלי</span>
          </h1>
          <p className="text-gray-600 mt-1">שיחות עם צוות התמיכה</p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין הודעות</h3>
            <p className="text-gray-600 mb-6">עדיין לא יצרת שיחה עם התמיכה</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#C9A24D] text-white px-6 py-2 rounded-lg hover:bg-[#B08C3C] transition"
            >
              חזרה לדף הבית
            </button>
          </div>
        ) : selectedConversation ? (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Conversation Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-600 hover:text-gray-900 transition flex items-center space-x-2 space-x-reverse"
              >
                <ArrowRight className="w-5 h-5" />
                <span>חזרה לרשימת השיחות</span>
              </button>
              <div>
                {selectedConversation.status === 'OPEN' ? (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    פתוח
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                    סגור
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {selectedConversation.messages.map((message) => {
                const isAdmin = message.senderType === 'ADMIN';
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] ${isAdmin ? 'bg-blue-50' : 'bg-green-50'} rounded-lg p-4`}>
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        {isAdmin ? (
                          <Shield className="w-4 h-4 text-blue-600" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-xs font-semibold text-gray-700">
                          {isAdmin ? 'תמיכה' : 'אתה'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Form */}
            {selectedConversation.status === 'OPEN' && (
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="כתוב הודעה..."
                    rows={3}
                    maxLength={2000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {replyMessage.length}/2000
                    </span>
                    <button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className="px-6 py-2 bg-[#C9A24D] text-white rounded-lg font-semibold hover:bg-[#B08C3C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
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
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {conversations.map((conversation) => {
              // Check if conversation has unread messages
              const hasUnread = !conversation.userLastReadAt || 
                (conversation.lastMessageAt && new Date(conversation.lastMessageAt) > new Date(conversation.userLastReadAt));
              
              return (
              <div
                key={conversation.id}
                onClick={() => fetchConversationDetail(conversation.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                  hasUnread ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">שיחה עם תמיכה</h3>
                      {conversation.status === 'OPEN' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          פתוח
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          סגור
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">
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
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserConversations;
