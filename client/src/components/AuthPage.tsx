import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleLoginButton from './GoogleLoginButton';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  initialMode?: AuthMode;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    acceptTerms: false,
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email: loginData.email });
      await login(loginData.email, loginData.password);
      
      // שמירת/מחיקת פרטי התחברות בהתאם ל-rememberMe
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      console.log('Login successful, navigating to /');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      // הצגת הודעה מפורטת לצורך דיבוג
      const errorMessage = err.response?.data?.message || 'פרטי ההתחברות שגויים';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (signupData.password !== signupData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (!signupData.acceptTerms) {
      setError('יש לאשר את תנאי השימוש ומדיניות הפרטיות');
      return;
    }

    setLoading(true);

    try {
      const data: any = {
        email: signupData.email,
        password: signupData.password,
      };

      // הוסף שם פרטי רק אם הוזן
      if (signupData.firstName && signupData.firstName.trim()) {
        data.name = signupData.firstName.trim();
      }

      console.log('Attempting registration with:', { ...data, password: '***' });
      await register(data);
      console.log('Registration successful, showing email verification message');
      
      // הצגת הודעת הצלחה על שליחת מייל אימות
      setRegisteredEmail(signupData.email);
      setRegistrationSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || 'שגיאה בהרשמה';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // נקה שגיאה כשמשתמש מתחיל להקליד שוב
    if (error) setError('');
    
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // נקה שגיאה כשמשתמש מתחיל להקליד שוב
    if (error) setError('');
    
    const { name, value, type, checked } = e.target;
    setSignupData({
      ...signupData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Registration Success Message */}
        {registrationSuccess ? (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">נרשמת בהצלחה!</h2>
            <p className="text-gray-600 mb-4">
              נשלח מייל אימות לכתובת: <strong>{registeredEmail}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              בדוק את תיבת הדואר שלך (כולל תיקיית הספאם) ולחץ על הקישור לאימות כדי להפעיל את החשבון.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setMode('login');
                }}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-700 transition"
              >
                חזרה להתחברות
              </button>
              <p className="text-xs text-gray-500">
                לא קיבלת מייל? בדוק שהכתובת נכונה ונסה שוב או צור קשר עם התמיכה.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="text-center mb-8">
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    mode === 'login'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  התחברות
                </button>
                <button
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    mode === 'signup'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  הרשמה
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                {mode === 'login' ? 'היכנס לחשבון שלך' : 'צור חשבון חדש'}
              </p>
            </div>

            <div className="card">
              {error && (
                <div
                  id="auth-error"
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg"
                >
                  {error}
                </div>
              )}

          {/* Google Login Button - משותף לשני המצבים */}
          <div className="mb-6">
            <GoogleLoginButton
              onError={setError}
              text={mode === 'signup' ? 'הירשם עם Google' : 'התחבר עם Google'}
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {mode === 'signup' ? 'או הירשם עם אימייל' : 'או'}
              </span>
            </div>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form key="login-form" onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium mb-2">
                  אימייל
                </label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  aria-describedby={error ? 'auth-error' : undefined}
                  aria-invalid={!!error}
                  className="input"
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium mb-2">
                  סיסמה
                </label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  aria-describedby={error ? 'auth-error' : undefined}
                  aria-invalid={!!error}
                  className="input"
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="text-sm text-gray-700">
                    זכור אותי
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:underline"
                >
                  שכחתי סיסמה
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-label="התחבר"
                className="btn-primary w-full"
              >
                {loading ? 'מתחבר...' : 'התחבר'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form key="signup-form" onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium mb-2">
                  אימייל *
                </label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  aria-describedby={error ? 'auth-error' : undefined}
                  aria-invalid={!!error}
                  className="input"
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium mb-2">
                  סיסמה *
                </label>
                <input
                  id="signup-password"
                  type="password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  aria-describedby={error ? 'auth-error' : undefined}
                  aria-invalid={!!error}
                  className="input"
                  required
                  placeholder="לפחות 6 תווים"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium mb-2">
                  אימות סיסמה *
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  name="confirmPassword"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  aria-describedby={error ? 'auth-error' : undefined}
                  aria-invalid={!!error}
                  className="input"
                  required
                  placeholder="הזן סיסמה שוב"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="signup-firstname" className="block text-sm font-medium mb-2">
                  שם פרטי (אופציונלי)
                </label>
                <input
                  id="signup-firstname"
                  type="text"
                  name="firstName"
                  value={signupData.firstName}
                  onChange={handleSignupChange}
                  className="input"
                  placeholder="שם פרטי"
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  id="signup-terms"
                  type="checkbox"
                  name="acceptTerms"
                  checked={signupData.acceptTerms}
                  onChange={handleSignupChange}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="signup-terms" className="text-sm text-gray-700">
                  קראתי ואישרתי את{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    תנאי השימוש
                  </a>
                  {' '}ואת{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    מדיניות הפרטיות
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !signupData.acceptTerms}
                aria-label="צור חשבון"
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'יוצר חשבון...' : 'צור חשבון'}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <>
                <p className="text-gray-600 mb-2">
                  עדיין אין לכם חשבון?{' '}
                  <button
                    onClick={() => {
                      setMode('signup');
                      setError('');
                    }}
                    className="text-primary-600 hover:underline font-medium"
                  >
                    הרשמה
                  </button>
                </p>
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  שכחת סיסמה?
                </Link>
              </>
            ) : (
              <p className="text-gray-600">
                כבר יש לך חשבון?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  התחברות
                </button>
              </p>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
