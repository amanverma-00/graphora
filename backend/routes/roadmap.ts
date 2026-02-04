import * as express from 'express';
import { protect, optionalAuth } from '../middleware/authMiddleware';
import {
    getAllRoadmaps,
    getRoadmap,
    enrollRoadmap,
    updateProgress
} from '../controller/roadmapController';

const roadmapRouter: express.Router = express.Router();

// Public routes (some with optional auth for progress check)
roadmapRouter.get('/', getAllRoadmaps);
roadmapRouter.get('/:slug', optionalAuth, getRoadmap);

// Protected routes
roadmapRouter.post('/:id/enroll', protect, enrollRoadmap);
roadmapRouter.patch('/:id/progress', protect, updateProgress);

export default roadmapRouter;
