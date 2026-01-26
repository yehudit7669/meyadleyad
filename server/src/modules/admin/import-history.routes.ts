import { Router, Request, Response, NextFunction } from 'express';
import { importHistoryService } from './import-history.service';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/admin/import-history
 * Get import history with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const importType = req.query.importType as string;

    const result = await importHistoryService.getImportHistory({
      page,
      limit,
      importType,
    });

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/import-history/:id
 * Get single import details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const importLog = await importHistoryService.getImportDetails(id);

    res.json({
      status: 'success',
      data: importLog,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/import-history/:id/check-approved-properties
 * Check if import has approved properties
 */
router.get('/:id/check-approved-properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await importHistoryService.checkApprovedPropertiesInImport(id);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/import-history/:id/check-approved-ads-cities-streets
 * Check if cities/streets from import have approved ads
 */
router.get('/:id/check-approved-ads-cities-streets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await importHistoryService.checkApprovedAdsUsingCitiesStreets(id);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/import-history/:id/properties
 * Delete imported properties
 */
router.delete('/:id/properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const includeApproved = req.query.includeApproved === 'true';

    const result = await importHistoryService.deleteImportedProperties(id, {
      includeApproved,
    });

    res.json({
      status: 'success',
      message: 'Import deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/import-history/:id/cities-streets
 * Delete imported cities and streets
 */
router.delete('/:id/cities-streets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleteWithApprovedAds = req.query.deleteWithApprovedAds === 'true';

    const result = await importHistoryService.deleteImportedCitiesStreets(id, {
      deleteWithApprovedAds,
    });

    res.json({
      status: 'success',
      message: 'Import deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
