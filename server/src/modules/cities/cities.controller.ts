import { Request, Response, NextFunction } from 'express';
import { CitiesService } from './cities.service';

const citiesService = new CitiesService();

export class CitiesController {
  async getAllCities(_req: Request, res: Response, next: NextFunction) {
    try {
      const cities = await citiesService.getAllCities();
      res.json({
        status: 'success',
        data: cities,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCityBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await citiesService.getCityBySlug(req.params.slug);
      res.json({
        status: 'success',
        data: city,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCity(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await citiesService.createCity(req.body);
      res.status(201).json({
        status: 'success',
        data: city,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCity(req: Request, res: Response, next: NextFunction) {
    try {
      const city = await citiesService.updateCity(req.params.id, req.body);
      res.json({
        status: 'success',
        data: city,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCity(req: Request, res: Response, next: NextFunction) {
    try {
      await citiesService.deleteCity(req.params.id);
      res.json({
        status: 'success',
        message: 'City deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
