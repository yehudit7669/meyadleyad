// Messaging System Page
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  // Get all conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesService.getConversations,
  }) as { data: any[] | undefined; isLoading: boolean };

  // Get messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: () => messagesService.getMessages(selectedConversation!),
    enabled: !!selectedConversation,
  }) as { data: any[] | undefined };

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (data: { conversationId: string; content: string }) =>
      messagesService.sendMessage(data.conversationId, data.content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    sendMutation.mutate({
      conversationId: selectedConversation,
      content: messageText,
    });
  };

  const selectedConv = conversations?.find((c: any) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">הודעות</h1>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-l border-gray-200 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">טוען...</div>
              ) : !conversations || conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p>אין לך הודעות</p>
                </div>
              ) : (
                conversations.map((conversation: any) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    aria-label={`פתח שיחה עם ${conversation.otherUser.name || conversation.otherUser.email}`}
                    aria-current={selectedConversation === conversation.id ? 'true' : 'false'}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-right ${
                      selectedConversation === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(conversation.otherUser.name || conversation.otherUser.email)[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{conversation.otherUser.name || conversation.otherUser.email}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.content || 'התחל שיחה'}
                        </div>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p>בחר שיחה כדי להתחיל</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(selectedConv?.otherUser.name || selectedConv?.otherUser.email || 'U')[0]}
                      </div>
                      <div>
                        <div className="font-bold">{selectedConv?.otherUser.name || selectedConv?.otherUser.email}</div>
                        <div className="text-sm text-gray-600">
                          לגבי: {selectedConv?.ad?.title || 'שיחה כללית'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages?.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.isOwn
                              ? 'bg-white border border-gray-200'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <div className="break-words">{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.isOwn ? 'text-gray-500' : 'text-blue-100'
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                              locale: he,
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="כתוב הודעה..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim() || sendMutation.isPending}
                        aria-label="שלח הודעה"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
                      >
                        שלח
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
