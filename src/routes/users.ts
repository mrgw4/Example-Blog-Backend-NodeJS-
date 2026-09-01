import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as user from '../services/userServices';
import { z } from 'zod';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(4).max(25),
  email: z.email(),
  password: z.string().min(6).max(100)});

/**
 * GET /api/users
 * Returns all users, excluding sensitive fields.

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
 * POST /api/users/login
 * Authenticates a user and returns a JWT when credentials are valid.
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const authenticatedUser = await user.loginUser(email, password);
        const userId = authenticatedUser._id?.toString?.() ?? authenticatedUser.id;
        const token = jwt.sign({ id: userId, email: authenticatedUser.email }, JWT_SECRET, {
            expiresIn: '1h',
        });
        await user.createSession(userId, token);

        return res.status(200).json({
            token,
            user: {
                id: userId,
                name: authenticatedUser.name,
                email: authenticatedUser.email,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        return res.status(401).json({ error: 'Invalid credentials' });
    }
});

/**
 * POST /api/users/logout
 * Removes the provided session token from the database.
 */
router.post('/logout', async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const rawAuth = req.headers.authorization;

        if (rawAuth === undefined) {
            // No Authorization header at all
            return res.status(400).json({ error: 'Authorization token is required' });
        }

        const authHeader = typeof rawAuth === 'string' ? rawAuth : String(rawAuth);
        // Accept either "Bearer <token>" (case-insensitive) or a raw token.
        const token = authHeader.replace(/^\s*Bearer\s+/i, '').trim();

        if (!token || token.length === 0) {
            // Authorization header present but token missing/malformed
            return res.status(401).json({ error: 'Invalid token' });
        }

        await user.deleteSessionToken(token);

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            return res.status(503).json({ error: 'Database unavailable' });
        }

        return res.status(401).json({ error: 'Invalid token' });
    }
});

/**
 * GET /api/users/:id
 * Returns a user by their ID, excluding sensitive fields.
 */
router.get('/:id', async (req: Request, res: Response): Promise<Response | void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Validate MongoDB ObjectId format to avoid Mongoose cast errors
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: 'Invalid user id format' });
        return;
    }

    try {
        const rawAuth = req.headers.authorization ?? '';
        const authHeader = typeof rawAuth === 'string' ? rawAuth : String(rawAuth);
        const token = authHeader.replace(/^\s*Bearer\s+/i, '').trim();
        let isVerified = false;

        if (token) {
            try {
                const verified = await user.verifySessionToken(token);
                isVerified = Boolean(verified?.userId);
            } catch (error) {
                if (error instanceof Error && error.message === 'Token expired') {
                    return res.status(401).json({ error: 'Token expired' });
                }

                isVerified = false;
            }
        }

        const userRecord = await user.getUser(id);

        if (!userRecord) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userObject = userRecord.toObject ? userRecord.toObject() : userRecord;
        const safeUser = { ...(userObject as unknown as Record<string, unknown>) };
        delete safeUser.password;

        if (!isVerified) {
            delete safeUser.email;
        }

        return res.status(200).json(safeUser);
    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            res.status(503).json({ error: 'Database unavailable' });
        } else if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch user' });
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

/**
 * Delete /api/user/:id
 * Deletes a user by their ID.
 * Responds with 400 for invalid IDs, 503 for database connectivity or service errors, and 200 on success.
 */
router.delete('/:id', async (req: Request, res: Response) => {

    try {
        const rawAuth = req.headers.authorization;

        if (rawAuth === undefined) {
            return res.status(400).json({ error: 'Authorization token is required' });
        }

        const authHeader = typeof rawAuth === 'string' ? rawAuth : String(rawAuth);
        // Accept either "Bearer <token>" (case-insensitive) or a raw token.
        const token = authHeader.replace(/^\s*Bearer\s+/i, '').trim();

        if (!token || token.length === 0) {
            // Authorization header present but token missing/malformed
            return res.status(401).json({ error: 'Invalid token' });
        }

        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id format' });
        }

        const userId = await user.verifySessionToken(token);

        if (!userId || userId.userId !== id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await user.deleteUser(id,token);

        return res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            return res.status(503).json({ error: 'Database unavailable' });
        }  else if (error instanceof Error && (error.message === 'Invalid token' || error.message === 'Token expired')) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }else {
            return res.status(500).json({ error: 'Failed to delete user' });
        }
    }
});

/**
 * PUT /api/users/:id
 * Updates a user's profile information (name and/or email).
 * Requires authentication and user can only update their own profile.
 */
router.put('/:id', async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id format' });
        }

        const rawAuth = req.headers.authorization;

        if (rawAuth === undefined) {
            return res.status(400).json({ error: 'Authorization token is required' });
        }

        const authHeader = typeof rawAuth === 'string' ? rawAuth : String(rawAuth);
        const token = authHeader.replace(/^\s*Bearer\s+/i, '').trim();

        if (!token || token.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const verified = await user.verifySessionToken(token);

        if (!verified || verified.userId !== id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, email } = req.body;

        if (!name && !email) {
            return res.status(400).json({ error: 'At least one field (name or email) is required to update' });
        }

        const updateData: { name?: string; email?: string } = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        const updatedUser = await user.updateUser(id, updateData);

        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser._id?.toString?.() ?? updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            return res.status(503).json({ error: 'Database unavailable' });
        } else if (error instanceof Error && error.message === 'Email already in use') {
            return res.status(400).json({ error: 'Email already in use' });
        } else if (error instanceof Error && error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        } else if (error instanceof Error && (error.message === 'Invalid token' || error.message === 'Token expired')) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            return res.status(500).json({ error: 'Failed to update user' });
        }
    }
});

/**
 * POST /api/users/:id/change-password
 * Changes a user's password after verifying the old password.
 * Requires authentication and user can only change their own password.
 */
router.post('/:id/change-password', async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id format' });
        }

        const rawAuth = req.headers.authorization;

        if (rawAuth === undefined) {
            return res.status(400).json({ error: 'Authorization token is required' });
        }

        const authHeader = typeof rawAuth === 'string' ? rawAuth : String(rawAuth);
        const token = authHeader.replace(/^\s*Bearer\s+/i, '').trim();

        if (!token || token.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const verified = await user.verifySessionToken(token);

        if (!verified || verified.userId !== id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old password and new password are required' });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from old password' });
        }

        await user.changePassword(id, oldPassword, newPassword);

        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        if (error instanceof Error && error.message.includes('connect')) {
            return res.status(503).json({ error: 'Database unavailable' });
        } else if (error instanceof Error && error.message === 'Invalid password') {
            return res.status(401).json({ error: 'Current password is incorrect' });
        } else if (error instanceof Error && error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        } else if (error instanceof Error && (error.message === 'Invalid token' || error.message === 'Token expired')) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            return res.status(500).json({ error: 'Failed to change password' });
        }
    }
});

export default router;