// ==================== ROUTES INDEX ====================
// Export all routes from a single entry point

import authRouter from './userAuth';
import problemRouter from './problemCreator';
import submitRouter from './submit';
import mockRouter from './mock';
import roadmapRouter from './roadmap';
import mentorRouter from './mentor';
import bookingRouter from './booking';

export {
    authRouter,
    problemRouter,
    submitRouter,
    mockRouter,
    roadmapRouter,
    mentorRouter,
    bookingRouter
};

export default {
    auth: authRouter,
    problem: problemRouter,
    submit: submitRouter,
    mock: mockRouter,
    roadmap: roadmapRouter,
    mentor: mentorRouter,
    booking: bookingRouter
};
