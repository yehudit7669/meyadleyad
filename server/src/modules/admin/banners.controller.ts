import { Request, Response, NextFunction } from 'express';
import { BannersService } from './banners.service';

const bannersService = new BannersService();

export class BannersController {
  async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannersService.createBanner(req.body);
      res.status(201).json(banner);
    } catch (error) {
      next(error);
    }
  }

  async getBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { position, isActive, page, limit } = req.query;
      
      const filters = {
        position: position as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const result = await bannersService.getBanners(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const banner = await bannersService.getBanner(id);
      res.json(banner);
    } catch (error) {
      next(error);
    }
  }

  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const banner = await bannersService.updateBanner(id, req.body);
      res.json(banner);
    } catch (error) {
      next(error);
    }
  }

  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await bannersService.deleteBanner(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async incrementClicks(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const banner = await bannersService.incrementClicks(id);
      res.json(banner);
    } catch (error) {
      next(error);
    }
  }

  async incrementImpressions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const banner = await bannersService.incrementImpressions(id);
      res.json(banner);
    } catch (error) {
      next(error);
    }
  }

  async getActiveBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { position } = req.query;
      const banners = await bannersService.getActiveBanners(position as string);
      res.json(banners);
    } catch (error) {
      next(error);
    }
  }
}
