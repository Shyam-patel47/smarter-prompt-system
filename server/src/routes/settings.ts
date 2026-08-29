import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.get('/export', settingsController.exportData);
router.put('/profile', settingsController.updateProfile);
router.post('/change-password', settingsController.changePassword);
router.delete('/account', settingsController.deleteAccount);

export default router;
