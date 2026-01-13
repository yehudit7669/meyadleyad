import { Router } from 'express';
import { BannersController } from './banners.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createBannerSchema, updateBannerSchema, getBannersSchema } from './banners.validation';

const router = Router();
const bannersController = new BannersController();

// Public routes
router.get('/active', bannersController.getActiveBanners);
router.post('/:id/click', bannersController.incrementClicks);
router.post('/:id/impression', bannersController.incrementImpressions);

// Admin routes
router.use(authenticate);
router.use(authorize('ADMIN'));

router.post('/', validate(createBannerSchema), bannersController.createBanner);
router.get('/', validate(getBannersSchema), bannersController.getBanners);
router.get('/:id', bannersController.getBanner);
router.put('/:id', validate(updateBannerSchema), bannersController.updateBanner);
router.delete('/:id', bannersController.deleteBanner);

export default router;
