import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { UserModel } from '../models/User';

const router = Router();

router.use(authenticateToken);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.find({}, 'name email').sort({ name: 1 });
    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: (error as Error).message,
    });
  }
});

export default router;
