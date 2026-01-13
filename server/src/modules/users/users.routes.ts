import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const usersController = new UsersController();

router.get('/profile', authenticate, usersController.getProfile);
router.put('/profile', authenticate, usersController.updateProfile);
router.get('/my-ads', authenticate, usersController.getMyAds);
router.get('/broker/:id', usersController.getBrokerProfile);

export default router;
