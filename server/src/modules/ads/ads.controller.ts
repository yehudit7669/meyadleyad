import { Request, Response, NextFunction } from 'express';
import { AdsService } from './ads.service';
import { AuthRequest } from '../../middlewares/auth';
import { watermarkService } from '../branding/watermark.service';
import path from 'path';

const adsService = new AdsService();

export class AdsController {
  async createAd(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log('CREATE AD - Request received', {
        userId: req.user!.id,
        body: req.body,
      });
      
      const ad = await adsService.createAd(req.user!.id, req.body);
      
      console.log('CREATE AD - Success', {
        adId: ad.id,
        title: ad.title,
      });
      
      res.status(201).json({
        status: 'success',
        data: ad,
      });
    } catch (error) {
      console.error('CREATE AD - Error', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(error);
    }
  }

  async updateAd(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ad = await adsService.updateAd(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      res.json({
        status: 'success',
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAd(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adsService.deleteAd(req.params.id, req.user!.id, req.user!.role);
      res.json({
        status: 'success',
        message: 'Ad deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAd(req: Request, res: Response, next: NextFunction) {
    try {
      const ad = await adsService.getAd(req.params.id);
      res.json({
        status: 'success',
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAds(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        categoryId: req.query.categoryId as string,
        cityId: req.query.cityId as string,
        cities: req.query.cities as string, // Support multiple cities
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        search: req.query.search as string,
        userId: req.query.userId as string,
        status: req.query.status as any,
      };

      const result = await adsService.getAds(filters);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadImages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log('🎯 [ADS_CONTROLLER] uploadImages called');
      console.log('🎯 [ADS_CONTROLLER] req.files:', req.files);
      console.log('🎯 [ADS_CONTROLLER] req.file:', req.file);
      
      const files = req.files as Express.Multer.File[];
      
      console.log('🎯 [ADS_CONTROLLER] Files array:', files);
      console.log('🎯 [ADS_CONTROLLER] Number of files:', files?.length || 0);
      
      if (files && files.length > 0) {
        console.log('🎯 [ADS_CONTROLLER] First file details:', {
          filename: files[0].filename,
          originalname: files[0].originalname,
          mimetype: files[0].mimetype,
          size: files[0].size,
          hasBuffer: !!files[0].buffer,
          hasPath: !!files[0].path,
        });
      }
      
      // עבור כל תמונה, הוסף watermark
      const imagesWithWatermark = await Promise.all(
        files.map(async (file, index) => {
          const filePath = path.join(process.cwd(), 'uploads', file.filename);
          const result = await watermarkService.applyWatermark(
            filePath,
            file.mimetype
          );

          // אם יש קובץ ממותג, השתמש בו
          // אחרת, השתמש במקורי
          const displayUrl = result.brandedPath
            ? `/uploads/branded/${path.basename(result.brandedPath)}`
            : `/uploads/${file.filename}`;

          return {
            url: displayUrl,
            originalUrl: `/uploads/${file.filename}`,
            brandedUrl: result.brandedPath
              ? `/uploads/branded/${path.basename(result.brandedPath)}`
              : null,
            order: index,
          };
        })
      );

      const ad = await adsService.addImages(req.params.id, req.user!.id, imagesWithWatermark);
      res.json({
        status: 'success',
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await adsService.deleteImage(req.params.imageId, req.user!.id);
      res.json({
        status: 'success',
        message: 'Image deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async incrementContactClick(req: Request, res: Response, next: NextFunction) {
    try {
      await adsService.incrementContactClick(req.params.id);
      res.json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}
