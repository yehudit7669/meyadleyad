import { Router } from 'express';
import { AdsController } from './ads.controller';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate';
import { upload } from '../../middlewares/upload';
import { createAdSchema, createWantedAdSchema, updateAdSchema, getAdsSchema } from './ads.validation';
import { validateParasha } from './validateParasha.middleware';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const adsController = new AdsController();

// Custom middleware to choose the correct validation schema
const validateAdCreation = (req: Request, res: Response, next: NextFunction) => {
  const wantedTypes = ['WANTED_FOR_SALE', 'WANTED_FOR_RENT', 'WANTED_HOLIDAY', 'WANTED_COMMERCIAL'];
  const adType = req.body.adType;
  
  console.log('VALIDATE AD CREATION - adType:', adType);
  
  if (adType && wantedTypes.includes(adType)) {
    console.log('VALIDATE AD CREATION - Using createWantedAdSchema');
    return validate(createWantedAdSchema)(req, res, next);
  } else {
    console.log('VALIDATE AD CREATION - Using createAdSchema');
    return validate(createAdSchema)(req, res, next);
  }
};

router.get('/', validate(getAdsSchema), adsController.getAds);
router.get('/:id', adsController.getAd);
router.post('/', authenticate, validateAdCreation, validateParasha, adsController.createAd);
router.put('/:id', authenticate, validate(updateAdSchema), validateParasha, adsController.updateAd);
router.delete('/:id', authenticate, adsController.deleteAd);

router.post('/:id/images', authenticate, upload.array('images', 10), adsController.uploadImages);
router.delete('/images/:imageId', authenticate, adsController.deleteImage);

router.post('/:id/contact-click', adsController.incrementContactClick);

export default router;
