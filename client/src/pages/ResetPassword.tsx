// Password Reset Page
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const resetMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
    onSuccess: () => {
      alert('הסיסמה שונתה בהצלחה!');
      navigate('/login');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }

    if (formData.password.length < 6) {
      alert('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (!token) {
      alert('קישור לא תקין');
      return;
    }

    resetMutation.mutate({ token, password: formData.password });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">קישור לא תקין</h2>
          <button
            onClick={() => navigate('/forgot-password')}
            aria-label="בקש קישור חדש לאיפוס סיסמה"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
          >
            בקש קישור חדש
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold mb-2">איפוס סיסמה</h2>
          <p className="text-gray-600">הזן סיסמה חדשה לחשבון שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה חדשה
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="לפחות 6 תווים"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אימות סיסמה
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="הזן שוב את הסיסמה"
            />
          </div>

          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <div className="text-red-600 text-sm">הסיסמאות אינן תואמות</div>
          )}

          <button
            type="submit"
            disabled={resetMutation.isPending || formData.password !== formData.confirmPassword}
            aria-label="עדכן סיסמה"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {resetMutation.isPending ? 'מעדכן...' : 'עדכן סיסמה'}
          </button>

          {resetMutation.isError && (
            <div className="text-red-600 text-sm text-center">
              שגיאה באיפוס הסיסמה. הקישור אולי פג תוקף.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
