import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service';

const categoriesService = new CategoriesService();

export class CategoriesController {
  async getAllCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAllCategories();
      res.json({
        status: 'success',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryBySlug(req.params.slug);
      res.json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.createCategory(req.body);
      res.status(201).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.updateCategory(req.params.id, req.body);
      res.json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await categoriesService.deleteCategory(req.params.id);
      res.json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
