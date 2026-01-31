# All Models in e:\interviewprep\backend\models

## Folder: backend\models | File: booking.ts
```typescript
import mongoose, { Schema } from 'mongoose';
import { IBooking } from '../types/type';

const BookingSchema = new Schema<IBooking>({
    mentor: { type: Schema.Types.ObjectId, ref: 'Mentor', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, enum: [30, 60], required: true },
    timezone: { type: String },
    type: { type: String, enum: ['video', 'chat'], default: 'video' },
    topic: { type: String },
    agenda: { type: String },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'pending'
    },
    meetingLink: { type: String },
    meetingProvider: { type: String, enum: ['jitsi', 'zoom', 'google_meet'] },
    recordingUrl: { type: String },
    payment: {
        amount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        stripePaymentId: { type: String },
        status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'] },
        paidAt: { type: Date }
    },
    studentFeedback: {
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String },
        submittedAt: { type: Date }
    },
    mentorNotes: { type: String },
    cancelledBy: { type: String, enum: ['student', 'mentor', 'system'] },
    cancellationReason: { type: String },
    cancelledAt: { type: Date }
}, {
    timestamps: true
});

BookingSchema.index({ mentor: 1, scheduledAt: 1 });
BookingSchema.index({ student: 1, status: 1 });
BookingSchema.index({ scheduledAt: 1, status: 1 });

const Booking = mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
```


## Folder: backend\models | File: codingProfile.ts
```typescript
import mongoose, { Schema } from 'mongoose';

const CodingProfileSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref:'User', unique:true },

    platforms: {
        leetcode: {
            username: String,
            totalSolved: { type: Number, default:0 },
            easySolved: { type: Number, default:0 },
            mediumSolved: { type: Number, default:0 },
            hardSolved: { type: Number, default:0 },
            ranking: Number,
            contestRating: Number,
            streak: Number,
            badges: [String],
            lastFetched: Date,
            fetchError: String
        },
        codeforces: {
            handle: String,
            rating: Number,
            maxRating: Number,
            rank: String,
            contestsCount: Number,
            lastFetched: Date
        },
        codechef: {
            username: String,
            rating: Number,
            stars: Number,
            globalRank: Number,
            lastFetched: Date
        },
        hackerrank: {
            username: String,
            badges: [String],
            certificates: [{ name: String, url: String }],
            lastFetched: Date
        },
        github: {
            username: String,
            contributions: Number,
            currentStreak: Number,
            longestStreak: Number,
            publicRepos: Number,
            followers: Number,
            topLanguages: [{ name: String, percentage: Number }],
            lastFetched: Date
        }
    },

    aggregatedStats: {
        totalProblemsSolved: Number,
        strongestTopics: [String],
        weakestTopics: [String],
        consistencyScore: Number,
        activeDaysThisMonth: Number
    },

    lastFullSync: Date,
    syncScheduled: Boolean
}, { timestamps:true });
```


## Folder: backend\models | File: company.ts
```typescript
import mongoose, { Schema } from 'mongoose';
import { ICompany } from '../types/type';

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true, unique: true, trim: true, index: true },
    logo: { type: String },
    description: { type: String, trim: true },
    website: { type: String, trim: true },
    hiring: { type: Boolean, default: true },
    interviewProcess: {
        rounds: { type: Number },
        typicalDuration: { type: String },
        stages: [{ type: String }]
    },
    salaryRange: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'INR' }
    },
    difficultyDistribution: {
        easy: { type: Number, default: 0, min: 0, max: 100 },
        medium: { type: Number, default: 0, min: 0, max: 100 },
        hard: { type: Number, default: 0, min: 0, max: 100 }
    },
    popularTopics: [{ type: String, trim: true }],
    totalProblems: { type: Number, default: 0 },
    mockSessionCount: { type: Number, default: 0 },
    averageMockScore: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

CompanySchema.index({ name: 1, isActive: 1 });
CompanySchema.index({ hiring: 1, isActive: 1 });

const Company = mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
```


## Folder: backend\models | File: groupStudy.ts
```typescript
import mongoose, { Schema } from 'mongoose';
const StudyGroupSchema=new Schema({
    name: { type: String, required:true, maxLength:100 },
    description: { type: String, maxLength:500 },
    avatar: { type: String },

    creator: { type: Schema.Types.ObjectId, ref:'User', required:true },
    members: [{
        user: { type: Schema.Types.ObjectId, ref:'User' },
        role: { type: String, enum: ['admin','moderator','member'], default:'member' },
        joinedAt: { type: Date, default: Date.now }
    }],

    settings: {
        isPublic: { type: Boolean, default:false },
        maxMembers: { type: Number, default:10, max:50 },
        joinCode: { type: String },// 6-char code for private groups
        allowInvites: { type: Boolean, default:true }
    },

    focus: {
        topics: [{ type: String }],// "DP", "Graphs", "System Design"
        difficulty: { type: String, enum: ['easy','medium','hard','mixed'] },
        targetCompanies: [String]
    },

    sessions: [{
        title: String,
        scheduledAt: Date,
        duration: Number,
        problems: [{ type: Schema.Types.ObjectId, ref:'Problem' }],
        meetingLink: String,
        host: { type: Schema.Types.ObjectId, ref:'User' },
        participants: [{ type: Schema.Types.ObjectId, ref:'User' }],
        status: { type: String, enum: ['scheduled','ongoing','completed','cancelled'] }
    }],

    conversation: { type: Schema.Types.ObjectId, ref:'Conversation' },

    stats: {
        totalProblemsAttempted: { type: Number, default:0 },
        totalMeetingsHeld: { type: Number, default:0 }
    },

    isActive: { type: Boolean, default:true }
}, { timestamps:true });
```


## Folder: backend\models | File: index.ts
```typescript
export { default as User } from './user';
export { default as Problem } from './problem';
export { default as Submission } from './submission';
export { default as MockSession } from './mockSession';
export { default as Roadmap } from './roadmap';
export { default as Company } from './company';
export { default as Mentor } from './mentor';
export { default as Booking } from './booking';
```


## Folder: backend\models | File: mentor.ts
```typescript
import mongoose, { Schema } from 'mongoose';
import { IMentor } from '../types/type';

const MentorSchema = new Schema<IMentor>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, maxLength: 150 },
    bio: { type: String, maxLength: 2000 },
    expertise: [{
        type: String,
        enum: ['DSA', 'System Design', 'Frontend', 'Backend', 'ML/AI', 'DevOps', 'Mobile']
    }],
    experience: {
        years: { type: Number },
        currentCompany: { type: String },
        currentRole: { type: String },
        pastCompanies: [{ type: String }]
    },
    availability: [{
        dayOfWeek: { type: Number, min: 0, max: 6 },
        slots: [{
            start: { type: String },
            end: { type: String }
        }]
    }],
    timezone: { type: String, default: 'Asia/Kolkata' },
    pricing: {
        thirtyMin: { type: Number },
        sixtyMin: { type: Number },
        currency: { type: String, default: 'INR' }
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
    },
    totalSessions: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    responseTime: { type: Number },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    isAcceptingBookings: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

MentorSchema.index({ 'rating.average': -1 });
MentorSchema.index({ expertise: 1, isActive: 1 });
MentorSchema.index({ verified: 1, isAcceptingBookings: 1 });

const Mentor = mongoose.model<IMentor>('Mentor', MentorSchema);

export default Mentor;
```


## Folder: backend\models | File: message.ts
```typescript
import mongoose, { Schema } from 'mongoose';
const ConversationSchema=new Schema({
    participants: [{ type: Schema.Types.ObjectId, ref:'User' }],
    type: { type: String, enum: ['direct','group','mentor'], default:'direct' },
    booking: { type: Schema.Types.ObjectId, ref:'Booking' },// If mentor chat
    lastMessage: {
        content: String,
        sender: { type: Schema.Types.ObjectId, ref:'User' },
        sentAt: Date
    },
    unreadCount: { type: Map, of: Number }
}, { timestamps:true });

const MessageSchema=new Schema({
    conversation: { type: Schema.Types.ObjectId, ref:'Conversation', required:true },
    sender: { type: Schema.Types.ObjectId, ref:'User', required:true },

    content: { type: String },
    type: { type: String, enum: ['text','code','file','image'], default:'text' },

// For code snippets
    codeBlock: {
        language: String,
        code: String
    },

// For files
    attachment: {
        url: String,
        name: String,
        size: Number,
        mimeType: String
    },

    readBy: [{
        user: { type: Schema.Types.ObjectId, ref:'User' },
        readAt: Date
    }],

    isDeleted: { type: Boolean, default:false }
}, { timestamps:true });

MessageSchema.index({ conversation:1, createdAt:-1 });
```


## Folder: backend\models | File: mockSession.ts
```typescript
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
```


## Folder: backend\models | File: problem.ts
```typescript
import mongoose, { Schema } from 'mongoose';
import { IProblem } from '../types/type';

const ProblemSchema = new Schema<IProblem>({
    title: { type: String, required: true, trim: true, maxLength: 200 },
    description: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    companyTags: [{ type: String, trim: true, index: true }],
    topics: [{ type: String, trim: true, index: true }],
    pattern: [{
        type: String,
        trim: true,
        enum: ['sliding window', 'two pointers', 'tree traversal', 'graph traversal', 'dynamic programming', 'backtracking', 'greedy', 'heap', 'binary search', 'stack', 'bit manipulation', 'matrix', 'prefix sum'],
        index: true
    }],
    visibleTestCases: [{
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, trim: true }
    }],
    hiddenTestCases: [{
        input: { type: String, required: true },
        output: { type: String, required: true }
    }],
    starterCode: [{
        language: { type: String, required: true },
        code: { type: String, required: true }
    }],
    solutions: [{
        language: { type: String, required: true },
        code: { type: String, required: true }
    }],
    constraints: { type: String, trim: true },
    hints: [{ type: String, trim: true }],
    memoryLimit: { type: Number, default: 256, min: 1, max: 1024 },
    timeLimit: { type: Number, default: 2000 },
    submissionsCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    slug: { type: String, unique: true, index: true },
    premium: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    relatedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }]
}, {
    timestamps: true
});

ProblemSchema.virtual('acceptanceRate').get(function () {
    if (this.submissionsCount === 0) return 0;
    return ((this.acceptedCount / this.submissionsCount) * 100).toFixed(1);
});

const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);

export default Problem;
```


## Folder: backend\models | File: roadmap.ts
```typescript
import mongoose, { Schema } from 'mongoose';
import { IRoadmap } from '../types/type';
const RoadmapSchema = new Schema<IRoadmap>({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: { type: String, trim: true },
    domain: {
        type: String,
        required: true,
        enum: ['MERN Stack', 'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Data Science', 'Machine Learning', 'Mobile Development', 'System Design'],
        index: true
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'all'],
        default: 'all',
        index: true
    },
    thumbnail: { type: String },
    duration: { type: Number, min: 1, max: 52 },
    modules: [{
        title: { type: String, required: true },
        order: { type: Number, required: true },
        description: { type: String, trim: true },
        topics: [{ type: String, trim: true }],
        resources: [{
            title: { type: String, required: true },
            url: { type: String, required: true },
            type: {
                type: String,
                enum: ['article', 'video', 'course', 'documentation', 'book'],
                default: 'article'
            },
            duration: { type: Number, min: 1 },
            isFree: { type: Boolean, default: true }
        }],
        problems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
        prerequisites: [{ type: Schema.Types.ObjectId }]
    }],
    enrolledUsers: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        completedModules: [{ type: Schema.Types.ObjectId }],
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        lastAccessedAt: { type: Date, default: Date.now }
    }],
    stats: {
        totalEnrollments: { type: Number, default: 0 },
        averageCompletionTime: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0, min: 0, max: 100 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        ratingsCount: { type: Number, default: 0 }
    },
    estimatedDuration: { type: Number },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

RoadmapSchema.index({ domain: 1, level: 1 });
RoadmapSchema.index({ slug: 1, isPublished: 1 });
RoadmapSchema.index({ 'stats.rating': -1 });
RoadmapSchema.index({ createdAt: -1 });

RoadmapSchema.pre('save', function () {
    if (!this.isModified('title')) return;

    this.slug = this.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
});

const Roadmap = mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);

export default Roadmap;
```


## Folder: backend\models | File: submission.ts
```typescript
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
```


## Folder: backend\models | File: subscription.ts
```typescript
import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema=new Schema({
    user: { type: Schema.Types.ObjectId, ref:'User', required:true },

    plan: { type: String, enum: ['free','pro','premium'], default:'free' },

    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String },

    amount: { type: Number },
    currency: { type: String, default:'INR' },
    interval: { type: String, enum: ['monthly','yearly'] },

    status: {
        type: String,
        enum: ['active','cancelled','past_due','trialing','expired'],
        default:'active'
    },

    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelledAt: Date,

    features: {
        unlimitedProblems: { type: Boolean, default:false },
        mockInterviews: { type: Number, default:3 },// per month
        profileSync: { type: Boolean, default:false },
        mentorMinutes: { type: Number, default:0 }
    }
}, { timestamps:true });
```


## Folder: backend\models | File: user.ts
```typescript
import mongoose, { Document, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { IUser, IUserModel } from '../types/type';

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true, trim: true, minLength: 3, maxLength: 20 },
    username: { type: String, unique: true, trim: true, lowercase: true, minLength: 3, maxLength: 20 },
    email: { type: String, required: true, lowercase: true, unique: true, trim: true },
    password: { type: String, required: true, minLength: 8 },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
    bio: { type: String, maxLength: 500 },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    languages: [{ type: String, enum: ['JavaScript', 'Python', 'C++', 'Java', 'Rust'] }],
    age: { type: Number, min: 13, max: 100 },
    role: { type: String, enum: ['user', 'admin', 'professor'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false },
    totalMocksAttempted: { type: Number, default: 0 },
    completedMocks: { type: Number, default: 0 },
    college: { type: String, trim: true, maxLength: 100 },
    companies: [{
        type: String,
        trim: true,
        enum: ['Microsoft', 'Google', 'Meta', 'Amazon', 'Apple', 'Oracle', 'Adobe', 'Salesforce', 'SAP', 'Intel', 'Qualcomm', 'Nvidia', 'Samsung']
    }],
    avatar: { type: String },
    timezone: { type: String, default: 'Asia/Kolkata' },
    lastLoginAt: { type: Date },
    subscription: {
        plan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
        expiresAt: { type: Date },
        stripeCustomerId: { type: String }
    },
    mentorProfile: { type: Schema.Types.ObjectId, ref: 'Mentor' },
    solvedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    bookmarkedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    stats: {
        totalSubmissions: { type: Number, default: 0 },
        acceptedSubmissions: { type: Number, default: 0 },
        averageRuntime: { type: Number, default: 0, min: 0 },
        accuracy: { type: Number, default: 0, min: 0, max: 100 },
        rank: { type: Number }
    },
    socialLinks: {
        github: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        portfolio: { type: String, trim: true }
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform(_doc: Document, ret: Record<string, unknown>) {
            delete ret.password;
            delete ret.otp;
            delete ret.otpExpiry;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ username: 1, isActive: 1 });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password') || this.isNew) return;
    this.passwordChangedAt = new Date(Date.now() - 1000);
});

UserSchema.statics.findByEmailorUsername = function (emailorUsername: string) {
    return this.findOne({
        $or: [
            { email: emailorUsername.toLowerCase() },
            { username: emailorUsername.toLowerCase() }
        ],
        isActive: true
    }).select('+password +otp +otpExpiry');
};

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateOTP = function (): string {
    const otp = crypto.randomInt(100000, 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    this.otp = otp;
    this.otpExpiry = otpExpiry;
    this.otpVerified = false;
    return otp;
};

UserSchema.methods.verifyOTP = function (otp: string): boolean {
    if (!this.otp || !this.otpExpiry) return false;
    if (Date.now() > this.otpExpiry.getTime()) return false;
    return this.otp === otp;
};

UserSchema.methods.clearOTP = function (): void {
    this.otp = undefined;
    this.otpExpiry = undefined;
    this.otpVerified = true;
};

UserSchema.methods.createPasswordResetToken = function (): string {
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store hashed token in database
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Token expires in 1 hour
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Return unhashed token (will be sent via email)
    return resetToken;
};

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
```


