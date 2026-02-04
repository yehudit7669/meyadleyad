import { Router, Request, Response, NextFunction } from 'express';
import { newspaperSheetController } from './newspaper-sheet.controller';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// כל הנתיבים דורשים הרשאת Admin
router.use(authenticate, requireAdmin);

/**
 * List all newspaper sheets
 * GET /api/admin/newspaper-sheets?page=1&limit=20&categoryId=...&cityId=...&status=...
 */
router.get('/', newspaperSheetController.listSheets.bind(newspaperSheetController));

/**
 * Get or create sheet for category + city
 * GET /api/admin/newspaper-sheets/category/:categoryId/city/:cityId
 */
router.get(
  '/category/:categoryId/city/:cityId',
  newspaperSheetController.getOrCreateSheet.bind(newspaperSheetController)
);

/**
 * Get single sheet by ID
 * GET /api/admin/newspaper-sheets/:id
 */
router.get('/:id', newspaperSheetController.getSheet.bind(newspaperSheetController));

/**
 * Update sheet details
 * PUT/PATCH /api/admin/newspaper-sheets/:id
 */
router.put('/:id', newspaperSheetController.updateSheet.bind(newspaperSheetController));
router.patch('/:id', newspaperSheetController.updateSheet.bind(newspaperSheetController));

/**
 * Delete sheet
 * DELETE /api/admin/newspaper-sheets/:id
 */
router.delete('/:id', newspaperSheetController.deleteSheet.bind(newspaperSheetController));

/**
 * Add listing to sheet
 * POST /api/admin/newspaper-sheets/:id/add-listing
 */
router.post(
  '/:id/add-listing',
  newspaperSheetController.addListing.bind(newspaperSheetController)
);

/**
 * Remove listing from sheet
 * DELETE /api/admin/newspaper-sheets/:id/listings/:listingId
 */
router.delete(
  '/:id/listings/:listingId',
  newspaperSheetController.removeListing.bind(newspaperSheetController)
);

/**
 * Update listing position (Drag & Drop)
 * PUT/PATCH /api/admin/newspaper-sheets/:id/listings/:listingId/position
 */
router.put(
  '/:id/listings/:listingId/position',
  newspaperSheetController.updateListingPosition.bind(newspaperSheetController)
);
router.patch(
  '/:id/listings/:listingId/position',
  newspaperSheetController.updateListingPosition.bind(newspaperSheetController)
);

/**
 * Generate General Sheet PDF (all properties)
 * POST /api/admin/newspaper-sheets/general/generate-pdf
 * ⚠️ Must be BEFORE /:id routes to avoid route conflict
 */
router.post(
  '/general/generate-pdf',
  newspaperSheetController.generateGeneralSheetPDF.bind(newspaperSheetController)
);

/**
 * View General Sheet PDF
 * GET /api/admin/newspaper-sheets/general/view
 */
router.get(
  '/general/view',
  newspaperSheetController.viewGeneralSheetPDF.bind(newspaperSheetController)
);

/**
 * Download General Sheet PDF
 * GET /api/admin/newspaper-sheets/general/download
 */
router.get(
  '/general/download',
  newspaperSheetController.downloadGeneralSheetPDF.bind(newspaperSheetController)
);

/**
 * Distribute General Sheet PDF
 * POST /api/admin/newspaper-sheets/general/distribute
 */
router.post(
  '/general/distribute',
  newspaperSheetController.distributeGeneralSheetPDF.bind(newspaperSheetController)
);

/**
 * Generate PDF for sheet
 * POST /api/admin/newspaper-sheets/:id/generate-pdf
 */
router.post(
  '/:id/generate-pdf',
  newspaperSheetController.generatePDF.bind(newspaperSheetController)
);

export default router;
