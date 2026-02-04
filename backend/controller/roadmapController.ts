import { Request, Response } from 'express';
import Roadmap from '../models/roadmap';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * @route   GET /api/roadmaps
 * @desc    Get all published roadmaps with filters
 * @access  Public
 */
export const getAllRoadmaps = async (req: Request, res: Response): Promise<void> => {
    try {
        const { domain, level, search } = req.query;
        const query: any = { isPublished: true };

        if (domain) query.domain = domain;
        if (level && level !== 'all') query.level = level;
        if (search) {
            query.$text = { $search: search as string };
        }

        const roadmaps = await Roadmap.find(query)
            .select('title slug description domain level thumbnail estimatedDuration stats')
            .sort({ 'stats.totalEnrollments': -1 });

        res.status(200).json({
            success: true,
            count: roadmaps.length,
            data: roadmaps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

/**
 * @route   GET /api/roadmaps/:slug
 * @desc    Get single roadmap details
 * @access  Public
 */
export const getRoadmap = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const roadmap = await Roadmap.findOne({ slug: req.params.slug });

        if (!roadmap) {
            res.status(404).json({ success: false, message: 'Roadmap not found' });
            return;
        }

        // Check enrollment status if user is logged in
        let userProgress = null;
        if (req.user) {
            const enrollment = roadmap.enrolledUsers.find(
                e => e.user.toString() === req.user?._id.toString()
            );
            if (enrollment) {
                userProgress = enrollment;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                roadmap,
                userProgress
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

/**
 * @route   POST /api/roadmaps/:id/enroll
 * @desc    Enroll in a roadmap
 * @access  Private
 */
export const enrollRoadmap = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        const roadmap = await Roadmap.findById(req.params.id);
        if (!roadmap) {
            res.status(404).json({ success: false, message: 'Roadmap not found' });
            return;
        }

        // Check if already enrolled
        const isEnrolled = roadmap.enrolledUsers.some(
            e => e.user.toString() === req.user?._id.toString()
        );

        if (isEnrolled) {
            res.status(400).json({ success: false, message: 'Already enrolled' });
            return;
        }

        // Add to enrolledUsers
        roadmap.enrolledUsers.push({
            user: req.user._id,
            progress: 0,
            completedModules: [],
            startedAt: new Date(),
            lastAccessedAt: new Date()
        });

        roadmap.stats.totalEnrollments += 1;
        await roadmap.save();

        res.status(200).json({
            success: true,
            message: 'Enrolled successfully',
            data: roadmap
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
};

/**
 * @route   PATCH /api/roadmaps/:id/progress
 * @desc    Update progress (mark module as complete)
 * @access  Private
 */
export const updateProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authorized' });
            return;
        }

        const { moduleId } = req.body;
        const roadmap = await Roadmap.findById(req.params.id);

        if (!roadmap) {
            res.status(404).json({ success: false, message: 'Roadmap not found' });
            return;
        }

        const enrollment = roadmap.enrolledUsers.find(
            e => e.user.toString() === req.user?._id.toString()
        );

        if (!enrollment) {
            res.status(403).json({ success: false, message: 'Not enrolled in this roadmap' });
            return;
        }

        // Toggle completion
        const isCompleted = enrollment.completedModules.some(id => id.toString() === moduleId);

        if (isCompleted) {
            enrollment.completedModules = enrollment.completedModules.filter(id => id.toString() !== moduleId);
        } else {
            enrollment.completedModules.push(moduleId);
        }

        // Recalculate progress %
        // Note: Ideally count nested items, but simplified to modules for now
        const totalModules = roadmap.modules.length;
        enrollment.progress = Math.round((enrollment.completedModules.length / totalModules) * 100);
        enrollment.lastAccessedAt = new Date();

        await roadmap.save();

        res.status(200).json({
            success: true,
            data: {
                progress: enrollment.progress,
                completedModules: enrollment.completedModules
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
};
