import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { validateRequest } from '../../middlewares/validation';
import { createCategorySchema, updateCategorySchema } from './category-management.validation';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all categories (including subcategories)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Category: { // Parent category
          select: {
            id: true,
            name: true,
            nameHe: true,
          },
        },
        other_Category: { // Subcategories
          select: {
            id: true,
            name: true,
            nameHe: true,
            slug: true,
            order: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            Ad: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { nameHe: 'asc' },
      ],
    });

    res.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        Category: true,
        other_Category: true,
        CategoryField: true,
        _count: {
          select: {
            Ad: true,
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
router.post('/', validateRequest({ body: createCategorySchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;

    const category = await prisma.category.create({
      data: {
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...req.body,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'CREATE_CATEGORY',
        targetId: category.id,
        meta: { category: req.body },
      },
    });

    res.json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category with this slug already exists' });
      return;
    }

    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.patch('/:id', validateRequest({ body: updateCategorySchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updatedAt: new Date(),
      },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'UPDATE_CATEGORY',
        targetId: category.id,
        meta: { updates: req.body },
      },
    });

    res.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category with this slug already exists' });
      return;
    }

    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (soft delete by setting isActive = false)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user.id;

    // Check if category has ads
    const adCount = await prisma.ad.count({
      where: { categoryId: req.params.id },
    });

    if (adCount > 0) {
      res.status(400).json({ 
        error: `Cannot delete category with ${adCount} ads. Please deactivate instead.` 
      });
      return;
    }

    // Check if it has subcategories
    const subcategoryCount = await prisma.category.count({
      where: { parentId: req.params.id },
    });

    if (subcategoryCount > 0) {
      res.status(400).json({ 
        error: `Cannot delete category with ${subcategoryCount} subcategories.` 
      });
      return;
    }

    // Soft delete
    await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_CATEGORY',
        targetId: req.params.id,
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Reorder categories
router.post('/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body; // Array of { id, order }
    const adminId = (req as any).user.id;

    if (!Array.isArray(orders)) {
      res.status(400).json({ error: 'Invalid orders format' });
      return;
    }

    // Update orders
    await Promise.all(
      orders.map(({ id, order }) =>
        prisma.category.update({
          where: { id },
          data: { order },
        })
      )
    );

    // Log audit
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'REORDER_CATEGORIES',
        meta: { count: orders.length },
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

export default router;
