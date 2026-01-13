import { Request, Response, NextFunction } from 'express';
import { streetsService } from './streets.service';

export class StreetsController {
  /**
   * GET /api/streets
   */
  async getStreets(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, cityId, limit } = req.query;
      
      const streets = await streetsService.getStreets({
        cityId: cityId as string,
        query: query as string,
        limit: limit ? parseInt(limit as string) : 100,
      });
      
      res.json(streets);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/streets/:id
   */
  async getStreetById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const street = await streetsService.getStreetById(id);
      res.json(street);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * GET /api/streets/city/beit-shemesh
   */
  async getBeitShemeshCity(_req: Request, res: Response, next: NextFunction) {
    try {
      const city = await streetsService.getBeitShemeshCity();
      res.json(city);
    } catch (error) {
      next(error);
    }
  }
}

export const streetsController = new StreetsController();
