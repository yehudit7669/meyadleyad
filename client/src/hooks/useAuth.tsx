import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ServiceProviderRegistrationData } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  registerServiceProvider: (data: ServiceProviderRegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const user = await authService.getCurrentUser();
          console.log('🔐 AUTH USER LOADED:', { role: user.role, userType: user.userType, serviceProviderType: user.serviceProviderType, isBroker: user.isBroker });
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('useAuth.login called with:', { email });
    const response = await authService.login(email, password);
    console.log('✅ LOGIN RESPONSE - AUTH USER:', { 
      role: response.user.role, 
      userType: response.user.userType, 
      serviceProviderType: response.user.serviceProviderType,
      isBroker: response.user.isBroker 
    });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    console.log('User state updated successfully');
  };

  const register = async (data: any) => {
    console.log('useAuth.register called with:', { ...data, password: '***' });
    const response = await authService.register(data);
    console.log('Registration response received:', { user: response.user });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    console.log('User state updated after registration');
  };

  const registerServiceProvider = async (data: ServiceProviderRegistrationData) => {
    console.log('useAuth.registerServiceProvider called');
    const response = await authService.registerServiceProvider(data);
    console.log('Service provider registration response received:', { user: response.user });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    console.log('User state updated after service provider registration');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      registerServiceProvider,
      logout, 
      updateUser, 
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
