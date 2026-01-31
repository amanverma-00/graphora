import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './config/db';

import authRouter from './routes/userAuth';
import problemRouter from './routes/problemCreator';
import submitRouter from './routes/submit';

import {
    apiLimiter,
    securityHeaders,
    sanitizeData,
    preventParamPollution,
    requestLogger,
    notFound,
    errorHandler,
} from './middleware/security';

const app = express();

// Trust proxy (fixed rate limit error)
app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(sanitizeData);
app.use(preventParamPollution);

if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
}

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRouter);
app.use('/api/problems', problemRouter);
app.use('/api/submit', submitRouter);

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/problemSubmission', submitRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        console.log('✅ Database connected successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
