import Analytics from './pages/admin/Analytics';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute, AdminRoute, BrandingRoute } from './components/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdDetails from './pages/AdDetails';
import CreateAd from './pages/CreateAd';
import EditAd from './pages/EditAd';
import MyAds from './pages/MyAds';
import Profile from './pages/Profile';
import BrokerProfile from './pages/BrokerProfile';
import MyBrokerProfile from './pages/MyBrokerProfile';
import PublicBrokerPage from './pages/PublicBrokerPage';
import ServiceProviderProfile from './pages/ServiceProviderProfile';
import ProviderPublicPage from './pages/ProviderPublicPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import UserProfilePage from './pages/admin/UserProfilePage';
import CityPage from './pages/CityPage';
import CategoryPage from './pages/CategoryPage';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import TestColors from './pages/TestColors';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import PublishAdSelection from './pages/PublishAdSelection';
import ResidentialWizard from './components/wizard/residential/ResidentialWizard';
import HolidayWizard from './components/wizard/holiday/HolidayWizard';
import ProjectWizard from './components/wizard/project/ProjectWizard';
import CommercialWizard from './components/wizard/commercial/CommercialWizard';
import JobWizard from './components/wizard/job/JobWizard';
import WantedForSaleWizard from './components/wizard/wanted/WantedForSaleWizard';
import WantedForRentWizard from './components/wizard/wanted/WantedForRentWizard';
import WantedHolidayWizard from './components/wizard/wanted/WantedHolidayWizard';
import BrandingLogoSettings from './pages/admin/BrandingLogoSettings';
import MyAppointments from './pages/appointments/MyAppointments';
import OwnerAppointments from './pages/appointments/OwnerAppointments';
import AppointmentsAdminPage from './pages/admin/AppointmentsAdminPage';
import AuditLog from './pages/admin/AuditLog';
import CategoriesManager from './pages/admin/CategoriesManager';
import ImportCitiesStreets from './pages/admin/ImportCitiesStreets';
import ImportAds from './pages/admin/ImportAds';
import ImportPropertiesFromFile from './pages/admin/ImportPropertiesFromFile';
import ImportHistory from './pages/admin/ImportHistory';
import MailingManager from './pages/admin/MailingManager';
import ScheduledAds from './pages/admin/ScheduledAds';
import PendingAds from './pages/PendingAds';
import AdminAdsManagement from './pages/AdminAdsManagement';
// New Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAdsPage from './pages/admin/AdminAdsPage';
import NewspaperLayoutPage from './pages/admin/NewspaperLayoutPage';
import NewspaperSheetEditorPage from './pages/admin/NewspaperSheetEditorPage';
import NewspaperVisualTestPage from './pages/admin/NewspaperVisualTestPage';
import ContentDistributionPage from './pages/admin/ContentDistributionPage';
import BrandingMediaPage from './pages/admin/BrandingMediaPage';
import ImportsPage from './pages/admin/ImportsPage';
import BackupsPage from './pages/admin/BackupsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  // Debug: וידוא שה-Client ID נטען
  console.log('GOOGLE CLIENT ID EXISTS:', !!googleClientId);
  console.log('GOOGLE CLIENT ID LENGTH:', googleClientId?.length || 0);
  console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <Toaster position="top-center" />
                {/* Skip to Content Link for Accessibility */}
                <a href="#main-content" className="skip-link">
                  דלג לתוכן הראשי
                </a>
                <Layout>
                  <main id="main-content">
                    <Routes>
                    <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Auth Routes */}
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Legal Pages */}
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  
                  {/* Publish Routes - New Wizard */}
                  <Route path="/publish" element={<ProtectedRoute><PublishAdSelection /></ProtectedRoute>} />
                  <Route path="/publish/wizard/:adType" element={<ProtectedRoute><ResidentialWizard /></ProtectedRoute>} />
                  <Route path="/publish/wizard/holiday_rent" element={<ProtectedRoute><HolidayWizard /></ProtectedRoute>} />
                  <Route path="/publish/wizard/service_providers" element={<ProtectedRoute><div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center p-8 bg-white rounded-lg shadow-md"><h2 className="text-2xl font-bold text-[#1F3F3A] mb-4">נותני שירות</h2><p className="text-gray-600">בקרוב...</p></div></div></ProtectedRoute>} />
                  <Route path="/publish/wizard/project" element={<ProtectedRoute><ProjectWizard /></ProtectedRoute>} />
                  <Route path="/publish/wizard/commercial" element={<ProtectedRoute><CommercialWizard /></ProtectedRoute>} />
                  <Route path="/publish/wizard/job" element={<ProtectedRoute><JobWizard /></ProtectedRoute>} />
                  
                  {/* Wanted (Drushim) Wizards */}
                  <Route path="/publish/wanted/for-sale" element={<ProtectedRoute><WantedForSaleWizard /></ProtectedRoute>} />
                  <Route path="/publish/wanted/for-rent" element={<ProtectedRoute><WantedForRentWizard /></ProtectedRoute>} />
                  <Route path="/publish/wanted/holiday" element={<ProtectedRoute><WantedHolidayWizard /></ProtectedRoute>} />
                  
                  {/* Ad Routes */}
                  <Route path="/ads/:id" element={<AdDetails />} />
                  <Route path="/ads/new" element={<ProtectedRoute><CreateAd /></ProtectedRoute>} />
                  <Route path="/ads/:id/edit" element={<ProtectedRoute><EditAd /></ProtectedRoute>} />
                  
                  {/* User Routes */}
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/broker/my-profile" element={<ProtectedRoute><MyBrokerProfile /></ProtectedRoute>} />
                  <Route path="/service-provider/my-profile" element={<ProtectedRoute><ServiceProviderProfile /></ProtectedRoute>} />
                  <Route path="/profile/ads" element={<ProtectedRoute><MyAds /></ProtectedRoute>} />
                  <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/appointments/me" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
                  <Route path="/appointments/owner" element={<ProtectedRoute><OwnerAppointments /></ProtectedRoute>} />
                  
                  {/* Broker Routes */}
                  <Route path="/broker/:id" element={<BrokerProfile />} />
                  <Route path="/brokers/:id" element={<PublicBrokerPage />} />
                  
                  {/* Service Provider Routes */}
                  <Route path="/providers/:id" element={<ProviderPublicPage />} />
                  
                  {/* Admin Routes - wrapped in AdminLayout */}
                  <Route path="/admin" element={<AdminRoute><Navigate to="/admin/dashboard" replace /></AdminRoute>} />
                  <Route path="/admin/dashboard" element={<AdminRoute><AdminLayout><AdminDashboardPage /></AdminLayout></AdminRoute>} />
                  
                  {/* Ads Management Routes */}
                  <Route path="/admin/ads/pending" element={<AdminRoute><AdminLayout><PendingAds /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/ads/manage" element={<AdminRoute><AdminLayout><AdminAdsPage /></AdminLayout></AdminRoute>} />
                  
                  {/* Legacy redirects for backward compatibility */}
                  <Route path="/admin/pending" element={<Navigate to="/admin/ads/pending" replace />} />
                  <Route path="/admin/ads" element={<Navigate to="/admin/ads/manage" replace />} />
                  
                  <Route path="/admin/newspaper" element={<AdminRoute><AdminLayout><NewspaperLayoutPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/newspaper/:sheetId/edit" element={<AdminRoute><AdminLayout><NewspaperSheetEditorPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/newspaper-visual-test" element={<AdminRoute><AdminLayout><NewspaperVisualTestPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><AdminLayout><UsersManagementPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/users/:userId" element={<AdminRoute><AdminLayout><UserProfilePage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/appointments" element={<AdminRoute><AdminLayout><AppointmentsAdminPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/content" element={<AdminRoute><AdminLayout><ContentDistributionPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/branding" element={<BrandingRoute><AdminLayout><BrandingMediaPage /></AdminLayout></BrandingRoute>} />
                  <Route path="/admin/imports" element={<AdminRoute><AdminLayout><ImportsPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/audit" element={<AdminRoute><AdminLayout><AuditLog /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/backups" element={<AdminRoute><AdminLayout><BackupsPage /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><AdminLayout><AdminSettingsPage /></AdminLayout></AdminRoute>} />
                  
                  {/* Legacy Admin Routes - keep for backward compatibility */}
                  <Route path="/admin/ads-management" element={<AdminRoute><AdminLayout><AdminAdsManagement /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/branding-logo" element={<BrandingRoute><AdminLayout><BrandingLogoSettings /></AdminLayout></BrandingRoute>} />
                  <Route path="/admin/scheduled-ads" element={<AdminRoute><AdminLayout><ScheduledAds /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/audit-log" element={<AdminRoute><AdminLayout><AuditLog /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/categories" element={<AdminRoute><AdminLayout><CategoriesManager /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/import-cities" element={<AdminRoute><AdminLayout><ImportCitiesStreets /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/import-ads" element={<AdminRoute><AdminLayout><ImportAds /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/import-properties" element={<AdminRoute><AdminLayout><ImportPropertiesFromFile /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/import-history" element={<AdminRoute><AdminLayout><ImportHistory /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/mailing" element={<AdminRoute><AdminLayout><MailingManager /></AdminLayout></AdminRoute>} />
                  <Route path="/admin/analytics" element={<AdminRoute><AdminLayout><Analytics /></AdminLayout></AdminRoute>} />
                  
                  {/* Search & Category Routes */}
                  <Route path="/category/:slug" element={<CategoryPage />} />
                  <Route path="/city/:slug" element={<CityPage />} />
                  <Route path="/test-colors" element={<TestColors />} />
                  
                  {/* 404 */}
                  <Route path="*" element={
                    <div className="container mx-auto px-4 py-16 text-center" dir="rtl">
                      <div className="text-6xl mb-4">🔍</div>
                      <h1 className="text-4xl font-bold mb-4">404 - הדף לא נמצא</h1>
                      <p className="text-gray-600 mb-8">הדף שחיפשת לא קיים במערכת</p>
                      <a 
                        href="/" 
                        aria-label="חזרה לדף הבית"
                        className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                      >
                        חזרה לדף הבית
                      </a>
                    </div>
                  } />
                </Routes>
                </main>
              </Layout>
            </AuthProvider>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        </GoogleOAuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
