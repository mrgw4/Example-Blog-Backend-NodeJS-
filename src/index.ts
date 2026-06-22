import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userRouter from './routes/users';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
async function connectDB() {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}   

// Routes
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/users', userRouter);

// Error handling middleware
app.use((_err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(_err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
async function startServer() {
    await connectDB();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`)
        })
}
    
startServer().catch(console.error);