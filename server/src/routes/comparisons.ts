import { Router } from 'express';
import * as comparisonController from '../controllers/comparisonController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.get('/', comparisonController.getComparisons);
router.post('/', comparisonController.createComparison);
router.post('/evaluate', comparisonController.evaluateWithAI);
router.put('/:id', comparisonController.updateComparison);

export default router;
