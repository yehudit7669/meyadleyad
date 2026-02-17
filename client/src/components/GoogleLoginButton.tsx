import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';

/**
 * Google Login Button Component
 * 
 * IMPORTANT: For Google OAuth to work, you must configure the following in Google Cloud Console:
 * 1. Go to: https://console.cloud.google.com/apis/credentials
 * 2. Select your OAuth 2.0 Client ID
 * 3. Add authorized JavaScript origins:
 *    - http://localhost:3000 (for development)
 *    - https://yourdomain.com (for production)
 * 4. Add authorized redirect URIs if needed
 * 
 * If you see "The given origin is not allowed" error:
 * - The current origin is not in the authorized list
 * - The component will hide itself to prevent UI breaking
 */

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
  text?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onError,
  text = 'התחבר עם Google'
}) => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [googleError, setGoogleError] = React.useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // אם אין Client ID או שיש בעיה - לא להציג את הכפתור
  if (!googleClientId || googleError) {
    return null;
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      if (onError) {
        onError('לא התקבל token מ-Google');
      }
      return;
    }

    setLoading(true);
    try {
      // Send ID token to backend
      const response = await authService.googleAuth(credentialResponse.credential);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      
      // Redirect based on role
      if (response.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (response.user.role === 'BROKER') {
        navigate('/profile');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      const errorMessage = err.response?.data?.message || 'שגיאה בהתחברות עם Google';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.warn('Google Login Error - ייתכן שה-origin לא מאושר ב-Google Cloud Console');
    // לא להציג שגיאה למשתמש - רק לא להציג את הכפתור בפעם הבאה
    setGoogleError(true);
    if (onError) {
      onError('התחברות עם Google אינה זמינה כרגע');
    }
  };

  return (
    <div className="w-full flex justify-center" style={{ opacity: loading ? 0.5 : 1 }}>
      <div className="w-full max-w-md">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text={text === 'הירשם עם Google' ? 'signup_with' : 'signin_with'}
          locale="he"
          theme="outline"
          size="large"
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;
