import { Router, Request, Response } from 'express';
import * as user from '../services/userServices';
import { z } from 'zod';

const router = Router();

// Validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(4).max(25),
  email: z.email(),
  password: z.string().min(6).max(100)});

/**
 * GET /api/users
 * Returns all users, excluding sensitive fields.
 * Handles database connectivity errors and returns the correct status code.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const users = await user.getAllUsers();

    res.status(200).json(users);
    
    } 
    catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            res.status(503).json({ error: 'Database unavailable' });
        } 
        else {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }
});


/**
 * POST /api/users
 * Creates a new user after validating required input fields.
 * Responds with 400 when required fields are missing,
 * 503 for database connectivity or service errors, and 201 on success.
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        else{
            const validated = CreateUserSchema.parse({ name, email, password });
            await user.createUser(validated);

            return res.status(201).json({ message: 'User created successfully'});
        }
    } 
    catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            return res.status(503).json({ error: 'Database unavailable' });
        } else {
            if (error instanceof Error) {
                return res.status(503).json({ error:  error.message});
            } else {
                return res.status(500).json({ error: 'Failed to create user' });
            }
        }
    }
});

export default router;