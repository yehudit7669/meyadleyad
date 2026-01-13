import { Router } from 'express';
import { streetsController } from './streets.controller';
import { validate } from '../../middlewares/validate';
import { getStreetsSchema, getStreetByIdSchema } from './streets.validation';

const router = Router();

// Public routes
router.get('/city/beit-shemesh', streetsController.getBeitShemeshCity);
router.get('/', validate(getStreetsSchema), streetsController.getStreets);
router.get('/:id', validate(getStreetByIdSchema), streetsController.getStreetById);

export default router;
