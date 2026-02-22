import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../../middlewares/auth';

const usersService = new UsersService();

export class UsersController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getProfile(req.user!.id);
      res.json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateProfile(req.user!.id, req.body);
      res.json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyAds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      const result = await usersService.getUserAds(req.user!.id, page, limit);
      res.json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrokerProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const broker = await usersService.getBrokerProfile(req.params.id);
      res.json({
        status: 'success',
        data: broker,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrokers(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query.cityId as string | undefined;
      const brokers = await usersService.getBrokers(cityId);
      res.json({
        status: 'success',
        data: brokers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const cityId = req.query.cityId as string | undefined;
      const providers = await usersService.getServiceProviders(cityId);
      res.json({
        status: 'success',
        data: providers,
      });
    } catch (error) {
      next(error);
    }
  }
}
