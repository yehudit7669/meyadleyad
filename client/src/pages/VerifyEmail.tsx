// Email Verification Page
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');

  const verifyMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    },
    onError: () => {
      setStatus('error');
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setStatus('error');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">📧</div>
            <h2 className="text-2xl font-bold mb-2">מאמת כתובת אימייל...</h2>
            <p className="text-gray-600">אנא המתן</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">האימייל אומת בהצלחה!</h2>
            <p className="text-gray-600 mb-6">כעת תוכל להתחבר למערכת</p>
            <div className="text-sm text-gray-500">מעביר אותך לדף ההתחברות...</div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">שגיאה באימות</h2>
            <p className="text-gray-600 mb-6">
              הקישור אינו תקף או שפג תוקפו
            </p>
            <button
              onClick={() => navigate('/login')}
              aria-label="חזור לעמוד ההתחברות"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              חזרה להתחברות
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
