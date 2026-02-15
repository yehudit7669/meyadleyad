import { Router } from 'express';
import { NeighborhoodsController } from './neighborhoods.controller';

const router = Router();
const neighborhoodsController = new NeighborhoodsController();

router.get('/', neighborhoodsController.getNeighborhoods);
router.get('/:id', neighborhoodsController.getNeighborhoodById);

export default router;
