import mongoose, { Schema } from 'mongoose';
import { ISubmission } from '../types/type';

const SubmissionSchema = new Schema<ISubmission>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    mockSession: { type: Schema.Types.ObjectId, ref: 'MockSession', index: true },
    code: { type: String, required: true },
    language: { type: String, required: true, enum: ['javascript', 'python', 'java', 'C++'], index: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Internal Error'],
        default: 'Pending',
        index: true
    },
    runtime: { type: Number, min: 0 },
    memory: { type: Number, min: 0 },
    errorMessage: { type: String, trim: true },
    testCasesPassed: { type: Number, default: 0 },
    testCasesTotal: { type: Number, default: 0 },
    testCasesResults: [{
        testCaseId: { type: Number },
        status: { type: String, enum: ['passed', 'failed', 'error'] },
        input: { type: String },
        expectedOutput: { type: String },
        actualOutput: { type: String },
        runtime: { type: Number },
        memory: { type: Number }
    }],
    attemptNumber: { type: Number },
    judge0SubmissionId: { type: String, index: true },
    evaluatedAt: { type: Date }
}, {
    timestamps: true
});

SubmissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
SubmissionSchema.index({ problem: 1, status: 1 });
SubmissionSchema.index({ user: 1, status: 1 });
SubmissionSchema.index({ mockSession: 1, problem: 1 });

const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;