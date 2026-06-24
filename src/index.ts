import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userRouter from './routes/users';
import testResetHandler from './test/testResetHandler';


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';
const database = process.env.DATABASE_SELECTION || '/blog_test';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB Connection
async function connectDB() {
    try {
        await mongoose.connect(mongoUri + database);
        console.log(mongoUri);
        console.log(database);
        console.log('MongoDB connected successfully');
        console.log(`Connected database: ${mongoose.connection.db?.databaseName}`);
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
app.use('/api/testreset', testResetHandler)

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