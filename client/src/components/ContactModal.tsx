import React, { useState } from 'react';
import { X, Send, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDialogA11y } from '../hooks/useDialogA11y';
import api from '../services/api';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { dialogRef } = useDialogA11y({ isOpen, onClose });
  const [message, setMessage] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = { message };
      
      if (!user) {
        // Guest user - validate email
        if (!guestEmail || !guestEmail.includes('@')) {
          setError('נא להזין כתובת אימייל תקינה');
          setLoading(false);
          return;
        }
        payload.guestEmail = guestEmail;
      }

      const response = await api.post<{ success: boolean; data: any }>('/contact', payload);

      if (response.data.success) {
        setSuccess(true);
        setMessage('');
        setGuestEmail('');
        
        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשליחת ההודעה. נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" dir="rtl">
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 space-x-reverse">
            <MessageCircle className="w-6 h-6 text-[#C9A24D]" />
            <h2 id="contact-modal-title" className="text-xl font-bold text-[#1F3F3A]">יצירת קשר</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="סגור"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ההודעה נשלחה בהצלחה!
              </h3>
              <p className="text-gray-600">
                נשוב אליך בהקדם האפשרי
              </p>
            </div>
          ) : (
            <>
              {/* Guest Email (if not logged in) */}
              {!user && (
                <div>
                  <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline ml-1" />
                    כתובת אימייל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="guestEmail"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    נשלח אליך תשובה במייל
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="w-4 h-4 inline ml-1" />
                  הודעה <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="כתוב את הודעתך כאן..."
                  rows={6}
                  maxLength={2000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C9A24D] focus:border-transparent resize-none"
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    מינימום 10 תווים
                  </p>
                  <p className="text-xs text-gray-500">
                    {message.length}/2000
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || message.length < 10}
                className="w-full bg-[#C9A24D] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B08C3C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>שולח...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>שלח הודעה</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
