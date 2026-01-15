import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { NewspaperController } from './newspaper.controller';

const router = Router();

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all newspaper PDFs (paginated)
router.get('/', NewspaperController.getAll);

// Generate newspaper PDF for an ad
router.post('/generate/:adId', NewspaperController.generate);

// Regenerate newspaper PDF (creates new version)
router.post('/regenerate/:newspaperAdId', NewspaperController.regenerate);

// View newspaper PDF (inline display)
router.get('/:newspaperAdId/view', NewspaperController.view);

// Download newspaper PDF (requires EXPORT permission)
router.get('/:newspaperAdId/download', NewspaperController.download);

// Distribute newspaper PDF to mailing list
router.post('/:newspaperAdId/distribute', NewspaperController.distribute);

// Delete newspaper PDF
router.delete('/:newspaperAdId', NewspaperController.delete);

// Get all versions of newspaper PDF for an ad
router.get('/versions/:adId', NewspaperController.getVersions);

export default router;
