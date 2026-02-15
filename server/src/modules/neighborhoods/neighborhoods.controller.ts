import { Request, Response } from 'express';
import { NeighborhoodsService } from './neighborhoods.service';

const neighborhoodsService = new NeighborhoodsService();

export class NeighborhoodsController {
  async getNeighborhoods(req: Request, res: Response) {
    try {
      const { cityId } = req.query;
      const neighborhoods = await neighborhoodsService.getNeighborhoods(cityId as string);
      res.json({ data: neighborhoods });
    } catch (error: any) {
      console.error('Error getting neighborhoods:', error);
      res.status(500).json({ message: 'שגיאה בטעינת שכונות' });
    }
  }

  async getNeighborhoodById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const neighborhood = await neighborhoodsService.getNeighborhoodById(id);
      
      if (!neighborhood) {
        return res.status(404).json({ message: 'שכונה לא נמצאה' });
      }

      res.json({ data: neighborhood });
    } catch (error: any) {
      console.error('Error getting neighborhood:', error);
      res.status(500).json({ message: 'שגיאה בטעינת שכונה' });
    }
  }
}
