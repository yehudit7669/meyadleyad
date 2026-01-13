// Password Reset Request Page
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const resetMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMutation.mutate(email);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📬</div>
            <h2 className="text-2xl font-bold mb-2">נשלח אימייל!</h2>
            <p className="text-gray-600 mb-6">
              שלחנו קישור לאיפוס סיסמה לכתובת: <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              בדוק את תיבת הדואר שלך (כולל תיקיית הספאם)
            </p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="text-3xl font-bold mb-2">שכחת סיסמה?</h2>
          <p className="text-gray-600">
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כתובת אימייל
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            aria-label="שלח קישור לאיפוס סיסמה"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {resetMutation.isPending ? 'שולח...' : 'שלח קישור לאיפוס'}
          </button>

          {resetMutation.isError && (
            <div className="text-red-600 text-sm text-center">
              שגיאה בשליחת האימייל. נסה שוב.
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:underline text-sm">
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}
