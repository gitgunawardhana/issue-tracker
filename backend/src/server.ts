import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';
import userRoutes from './routes/users';

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/issue-tracker';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Issue Tracker API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
