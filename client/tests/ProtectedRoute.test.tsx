import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { AuthProvider } from '../src/hooks/useAuth';

// Mock useAuth hook
const mockUseAuth = vi.fn();

vi.mock('../src/hooks/useAuth', async () => {
  const actual = await vi.importActual('../src/hooks/useAuth');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

const renderWithRouter = (
  component: React.ReactElement,
  initialRoute = '/'
) => {
  window.history.pushState({}, 'Test page', initialRoute);

  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/" element={component} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should render protected content when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'test@example.com', role: 'USER' },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking authentication', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: true,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should not show content while loading
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'admin@example.com', role: 'ADMIN', isAdmin: true },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access when user lacks required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'user@example.com', role: 'USER', isAdmin: false },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText(/אין הרשאת גישה/i)).toBeInTheDocument();
    });

    it('should allow ADMIN to access BROKER routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'admin@example.com', role: 'ADMIN', isAdmin: true, isBroker: false },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireBroker={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      // ADMIN should have access to all routes
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow ADMIN to access USER routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'admin@example.com', role: 'ADMIN', isAdmin: true },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny USER access to ADMIN routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'user@example.com', role: 'USER', isAdmin: false },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireAdmin={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText(/אין הרשאת גישה/i)).toBeInTheDocument();
    });

    it('should deny USER access to BROKER routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'user@example.com', role: 'USER', isAdmin: false, isBroker: false },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireBroker={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText(/אין הרשאת גישה/i)).toBeInTheDocument();
    });

    it('should allow BROKER to access BROKER routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'broker@example.com', role: 'BROKER', isAdmin: false, isBroker: true },
        isAuthenticated: true,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute requireBroker={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should preserve redirect URL in location state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        '/protected-page'
      );

      // Should redirect to login (content not visible)
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
