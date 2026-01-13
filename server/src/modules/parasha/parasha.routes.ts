import { Router } from 'express';
import { ParashaController } from './parasha.controller';

const router = Router();
const parashaController = new ParashaController();

/**
 * @route   GET /api/parasha/upcoming
 * @desc    Get upcoming Shabbat parashot
 * @access  Public
 */
router.get('/upcoming', (req, res, next) => parashaController.getUpcoming(req, res, next));

/**
 * @route   GET /api/parasha/validate/:name
 * @desc    Validate if a parasha name is valid
 * @access  Public
 */
router.get('/validate/:name', (req, res, next) => parashaController.validate(req, res, next));

export default router;
