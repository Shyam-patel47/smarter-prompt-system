import { Router } from 'express';
import * as promptController from '../controllers/promptController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.get('/', promptController.getPrompts);
router.get('/trash', promptController.getTrash);
router.post('/generate', promptController.generatePromptWithAI);
router.get('/:id', promptController.getPrompt);
router.post('/', promptController.createPrompt);
router.put('/:id', promptController.updatePrompt);
router.delete('/:id', promptController.deletePrompt);

router.put('/:id/restore', promptController.restorePrompt);
router.delete('/:id/hard', promptController.hardDeletePrompt);

router.get('/:id/versions', promptController.getVersions);
router.post('/:id/restore/:versionId', promptController.restoreVersion);

export default router;
