import { Router, Request, Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import Prompt from '../models/Prompt';
import Comparison from '../models/Comparison';
import User from '../models/User';

const router = Router();
router.use(authenticateJWT);

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [totalPrompts, favPrompts, comparisonsRun] = await Promise.all([
      Prompt.countDocuments({ userId, deletedAt: null }),
      Prompt.countDocuments({ userId, deletedAt: null, isFavorite: true }),
      Comparison.countDocuments({ userId })
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const promptsThisWeek = await Prompt.countDocuments({ 
      userId, 
      deletedAt: null,
      createdAt: { $gte: oneWeekAgo } 
    });

    res.json({
      totalPrompts,
      promptsThisWeek,
      favPrompts,
      comparisonsRun
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

export default router;
