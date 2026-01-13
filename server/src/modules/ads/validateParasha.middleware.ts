import { Request, Response, NextFunction } from 'express';
import { parashaService } from '../parasha/parasha.service.js';

/**
 * Middleware to validate parasha in holiday/shabbat ads
 * Checks if the parasha name exists in upcoming parashot
 */
export const validateParasha = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customFields, adType } = req.body;

    // Only validate for holiday/shabbat related ads
    const shabbatTypes = ['HOLIDAY_RENT', 'WANTED_HOLIDAY'];
    if (!adType || !shabbatTypes.includes(adType)) {
      return next();
    }

    // Check if customFields contains parasha
    if (!customFields || !customFields.parasha) {
      return res.status(400).json({
        message: 'פרשה חובה למודעות דירה לשבת',
        field: 'parasha',
      });
    }

    const parashaName = customFields.parasha;

    // Validate that the parasha exists in upcoming parashot
    const isValid = await parashaService.isValidParasha(parashaName);

    if (!isValid) {
      return res.status(400).json({
        message: `הפרשה "${parashaName}" אינה תקפה. אנא בחר פרשה מהרשימה`,
        field: 'parasha',
      });
    }

    // Validation passed
    next();
  } catch (error) {
    console.error('Error validating parasha:', error);
    // Don't fail the request if validation service has issues
    // Just log and continue
    next();
  }
};
