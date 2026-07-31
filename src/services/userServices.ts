import User from '../models/User';
import Session from '../models/Session';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_MAX_AGE_MS = 60 * 60 * 1000;

/**
 * Retrieves all users from the database, omitting password and email fields.
 * @returns Promise resolving to the list of users.
 */
export async function getAllUsers() {
   return User.find().select('-password -email').sort({ name: -1 });
}

/**
 * Retrieves a user by their ID from the database, omitting password and email fields.
 * @param id The user's ID.
 * @returns Promise resolving to the user document or null if not found.
 */
export async function getUser(id: string) {
   return User.findById(id);
}

/**
 * Creates a new user after validating that the email is not already in use.
 * The password is hashed before being saved.
 * @param userData The raw user payload containing name, email, and password.
 * @returns Promise resolving to the created user document.
 * @throws {Error} when the email is already in use.
 */
export async function createUser(userData: { name:string; email: string; password: string }){

    const user = await User.findOne({email: userData.email});

    if (user) {
        throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    
    return User.create({name: userData.name, email: userData.email, password: hashedPassword,});
}

/**
 * Validates credentials and returns the authenticated user if successful.
 * @param email The user's email address.
 * @param password The user's plaintext password.
 * @returns Promise resolving to the authenticated user document.
 * @throws {Error} when authentication fails.
 */
export async function loginUser(email: string, password: string) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        throw new Error('Invalid credentials');
    }

    return user;
}

export async function createSession(userId: string, token: string) {
    return Session.create({ user_id: userId, jwt: token });
}

export async function verifySessionToken(token: string) {
    const session = await Session.findOne({ jwt: token });

    if (!session) {
        throw new Error('Invalid token');
    }

    const createdAt = session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt);
    const ageMs = Date.now() - createdAt.getTime();

    if (ageMs > TOKEN_MAX_AGE_MS) {
        await Session.deleteOne({ _id: session._id });
        throw new Error('Token expired');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; email?: string };

    if (!decoded || !decoded.id) {
        await Session.deleteOne({ _id: session._id });
        throw new Error('Invalid token');
    }

    return { userId: decoded.id, email: decoded.email, session };
}

export async function deleteSessionToken(token: string) {
    const deletedSession = await Session.findOneAndDelete({ jwt: token });

    if (!deletedSession) {
        throw new Error('Invalid token');
    }

    return deletedSession;
}