import { Router } from 'express';
import { SearchController } from './search.controller';

const router = Router();
const searchController = new SearchController();

router.get('/autocomplete', searchController.autocomplete);
router.get('/nearby', searchController.searchNearby);

export default router;
