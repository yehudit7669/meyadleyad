import { Router } from 'express';
import { PDFController } from './pdf.controller';

const router = Router();
const pdfController = new PDFController();

// Generate PDF for single ad
router.get('/ad/:id', pdfController.generateAdPDF);

// Generate newspaper PDF (collection of ads)
router.get('/newspaper', pdfController.generateNewspaperPDF);

export default router;
