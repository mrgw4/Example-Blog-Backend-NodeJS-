import User from '../models/User';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Retrieves all users from the database, omitting password and email fields.
 * @returns Promise resolving to the list of users.
 */
export async function getAllUsers() {
   return User.find().select('-password -email').sort({ name: -1 });
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