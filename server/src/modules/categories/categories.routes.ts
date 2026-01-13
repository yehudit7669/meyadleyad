import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();
const categoriesController = new CategoriesController();

router.get('/', categoriesController.getAllCategories);
router.get('/:slug', categoriesController.getCategoryBySlug);
router.post('/', authenticate, authorize('ADMIN'), categoriesController.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), categoriesController.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), categoriesController.deleteCategory);

export default router;
