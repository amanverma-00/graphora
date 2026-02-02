// ==================== ROUTES INDEX ====================
// Export all routes from a single entry point

import authRouter from './userAuth';
import problemRouter from './problemCreator';
import submitRouter from './submit';
import mockRouter from './mock';

export {
    authRouter,
    problemRouter,
    submitRouter,
    mockRouter
};

export default {
    auth: authRouter,
    problem: problemRouter,
    submit: submitRouter,
    mock: mockRouter
};
