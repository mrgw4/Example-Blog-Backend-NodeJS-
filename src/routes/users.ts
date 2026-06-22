import { Router, Request, Response } from 'express';
import * as user from '../services/userServices';

const router = Router();

// GET all users
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await user.getAllUsers();

    res.status(200).json(users);
    
    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            res.status(503).json({ error: 'Database unavailable' });
        } 
        else {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
});

export default router;