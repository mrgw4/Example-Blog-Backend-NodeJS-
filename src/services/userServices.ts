import User from '../models/User';

export async function getAllUsers() {
   return User.find().select('-_id -password -email').sort({ name: -1 });
}

export async function createUser(userData: { name:string; email: string; password: string }){
    return User.create(userData);
}