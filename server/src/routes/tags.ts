import { Router } from 'express';
import * as tagController from '../controllers/tagController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.get('/', tagController.getTags);
router.post('/', tagController.createTag);

export default router;
