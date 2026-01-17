import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import adsRoutes from '../modules/ads/ads.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import citiesRoutes from '../modules/cities/cities.routes';
import streetsRoutes from '../modules/streets/streets.routes';
import adminRoutes from '../modules/admin/admin.routes';
import pdfRoutes from '../modules/pdf/pdf.routes';
import bannersRoutes from '../modules/admin/banners.routes';
import searchRoutes from '../modules/search/search.routes';
import parashaRoutes from '../modules/parasha/parasha.routes';
import brandingRoutes from '../modules/branding/branding.routes';
import profileRoutes from '../modules/profile/profile.routes';
import appointmentsRoutes from '../modules/appointments/appointments.routes';
import brokerRoutes from '../modules/broker/broker.routes';
import serviceProviderRoutes from '../modules/service-provider/service-provider.routes';

// New admin modules
import analyticsRoutes from '../modules/admin/analytics.routes';
import appointmentsAdminRoutes from '../modules/admin/appointments.routes';
import contentDistributionRoutes from '../modules/admin/content-distribution.routes';
import pdfExportRoutes from '../modules/admin/pdf-export.routes';
import importRoutes from '../modules/admin/import.routes';
import auditLogRoutes from '../modules/admin/audit-log.routes';
import categoryManagementRoutes from '../modules/admin/category-management.routes';
import adminDashboardRoutes from '../modules/admin/admin-dashboard.routes';
import newspaperRoutes from '../modules/newspaper/newspaper.routes';
import usersAdminRoutes from '../modules/admin/users/users-admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/ads', adsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/cities', citiesRoutes);
router.use('/streets', streetsRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/branding', brandingRoutes);
router.use('/pdf', pdfRoutes);
router.use('/banners', bannersRoutes);
router.use('/search', searchRoutes);
router.use('/parasha', parashaRoutes);
router.use('/profile', profileRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/broker', brokerRoutes); // New broker routes
router.use('/service-providers', serviceProviderRoutes); // Service provider routes

// New admin routes
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/users', usersAdminRoutes);
router.use('/admin/analytics', analyticsRoutes);
router.use('/admin/appointments', appointmentsAdminRoutes);
router.use('/admin/content-distribution', contentDistributionRoutes);
router.use('/admin/pdf-export', pdfExportRoutes);
router.use('/admin/import', importRoutes);
router.use('/admin/audit-log', auditLogRoutes);
router.use('/admin/categories', categoryManagementRoutes);
router.use('/admin/newspaper', newspaperRoutes);

export default router;
