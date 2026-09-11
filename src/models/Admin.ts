import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
}

const AdminSchema: Schema = new Schema<IAdmin>(
    {
        _id: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Types.ObjectId,
            required: true,
        }
    },
    {
        timestamps: true
    }
);

const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;