import { Request, Response, NextFunction } from 'express';
import { parashaService } from './parasha.service.js';

export class ParashaController {
  /**
   * Get upcoming Shabbat parashot
   * GET /api/parasha/upcoming
   */
  async getUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      
      // Validate limit
      if (limit < 1 || limit > 100) {
        res.status(400).json({ 
          message: 'Limit must be between 1 and 100' 
        });
        return;
      }

      const parashot = await parashaService.getUpcomingParashot(limit);

      res.json(parashot);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate a parasha name
   * GET /api/parasha/validate/:name
   */
  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const isValid = await parashaService.isValidParasha(name);

      res.json({ valid: isValid });
    } catch (error) {
      next(error);
    }
  }
}
