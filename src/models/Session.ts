import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    _id: mongoose.Types.ObjectId;
    user_id: string;
    jwt: string;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema: Schema = new Schema<ISession>(
    {
        user_id: {
            type: String,
            required: [true, 'Please provide a user id'],
            trim: true,
        },
        jwt: {
            type: String,
            required: [true, 'Please provide a token'],
            unique: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Session = mongoose.model<ISession>('Session', SessionSchema);

export default Session;
