import { Router } from 'express';
import { CitiesController } from './cities.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const citiesController = new CitiesController();

router.get('/', citiesController.getAllCities);
router.get('/:slug', citiesController.getCityBySlug);
router.post('/', authenticate, authorize('ADMIN'), citiesController.createCity);
router.put('/:id', authenticate, authorize('ADMIN'), citiesController.updateCity);
router.delete('/:id', authenticate, authorize('ADMIN'), citiesController.deleteCity);

export default router;
