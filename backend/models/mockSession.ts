import mongoose, { Schema, Document } from 'mongoose';

export interface IMockSession extends Document {
    user: mongoose.Types.ObjectId;
    type: 'company' | 'difficulty' | 'pattern' | 'custom';
    config: {
        company?: string;
        difficulty?: string;
        pattern?: string;
        problemCount: number;
    };
    problems: Array<{
        problem: mongoose.Types.ObjectId;
        order: number;
        submission?: mongoose.Types.ObjectId;
        timeSpent: number;
        solved: boolean;
        startedAt?: Date;
        completedAt?: Date;
    }>;
    timeLimit: number;
    startedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'abandoned';
    score: {
        solved: number;
        total: number;
        totalTime?: number;
        averageTime?: number;
        percentile?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const MockSessionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: {
        type: String,
        enum: ['company', 'difficulty', 'pattern', 'custom'],
        required: true
    },
    config: {
        company: { type: String },
        difficulty: { type: String },
        pattern: { type: String },
        problemCount: { type: Number, default: 3 }
    },

    problems: [{
        problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
        order: { type: Number, required: true },
        submission: { type: Schema.Types.ObjectId, ref: 'Submission' },
        timeSpent: { type: Number, default: 0 },
        solved: { type: Boolean, default: false },
        startedAt: { type: Date },
        completedAt: { type: Date }
    }],

    timeLimit: { type: Number, default: 90 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'expired', 'abandoned'],
        default: 'pending',
        index: true
    },

    score: {
        solved: { type: Number, default: 0 },
        total: { type: Number, default: 3 },
        totalTime: { type: Number },
        averageTime: { type: Number },
        percentile: { type: Number }
    }
}, {
    timestamps: true
});

MockSessionSchema.index({ user: 1, status: 1, createdAt: -1 });
MockSessionSchema.index({ 'config.company': 1, status: 1 });
MockSessionSchema.index({ type: 1, createdAt: -1 });

const MockSession = mongoose.model<IMockSession>('MockSession', MockSessionSchema);
export default MockSession;