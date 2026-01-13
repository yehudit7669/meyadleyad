import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FullPageLoading } from './LoadingSkeletons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireBroker?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireBroker = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoading message="מאמת הרשאות..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">אין הרשאת גישה</h2>
          <p className="text-gray-600 mb-6">דף זה מיועד למנהלי מערכת בלבד</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            חזרה לדף הבית
          </a>
        </div>
      </div>
    );
  }

  if (requireBroker && !user.isBroker && !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">אין הרשאת גישה</h2>
          <p className="text-gray-600 mb-6">דף זה מיועד למתווכים בלבד</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            חזרה לדף הבית
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Alias for Admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireAdmin={true}>{children}</ProtectedRoute>;
}

// Alias for Broker-only routes
export function BrokerRoute({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requireBroker={true}>{children}</ProtectedRoute>;
}

export default ProtectedRoute;
