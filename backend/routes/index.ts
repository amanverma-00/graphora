// ==================== ROUTES INDEX ====================
// Export all routes from a single entry point

import authRouter from './userAuth';
import problemRouter from './problemCreator';
import submitRouter from './submit';

export {
    authRouter,
    problemRouter,
    submitRouter
};

export default {
    auth: authRouter,
    problem: problemRouter,
    submit: submitRouter
};
