import { Request, Response, NextFunction } from 'express';
import { PDFService } from './pdf.service';
import { AdsService } from '../ads/ads.service';

const pdfService = new PDFService();
const adsService = new AdsService();

export class PDFController {
  async generateAdPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ad = await adsService.getAd(id, false);

      const pdf = await pdfService.generateAdPDF({
        title: ad.title,
        description: ad.description,
        price: ad.price || undefined,
        category: ad.category.nameHe,
        city: ad.city?.nameHe,
        images: ad.images.map((img: any) => img.url),
        user: {
          name: ad.user.name,
          phone: ad.user.phone || undefined,
          email: ad.user.email,
        },
      });

      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ad-${id}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  async generateNewspaperPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, cityId, date } = req.query;

      const filters: any = {
        status: 'APPROVED' as any,
      };

      if (categoryId) {
        filters.categoryId = categoryId as string;
      }

      if (cityId) {
        filters.cityId = cityId as string;
      }

      if (date) {
        const targetDate = new Date(date as string);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        filters.publishedAt = {
          gte: targetDate,
          lt: nextDay,
        };
      }

      const result = await adsService.getAds({ ...filters, limit: 50 });

      const ads = result.ads.map((ad: any) => ({
        title: ad.title,
        description: ad.description,
        price: ad.price || undefined,
        category: ad.category.nameHe,
        city: ad.city?.nameHe,
        images: ad.images.map((img: any) => img.url),
      }));

      const pdf = await pdfService.generateNewspaperPDF(ads);

      res.contentType('application/pdf');
      const filename = `newspaper-${date || new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
}
