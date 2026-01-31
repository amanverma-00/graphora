import { Document, Model, Types } from 'mongoose';

// ==================== ENUMS ====================
export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserRole = 'user' | 'admin' | 'professor';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type ProgrammingLanguage = 'JavaScript' | 'Python' | 'C++' | 'Java' | 'Rust';
export type SubmissionLanguage = 'javascript' | 'python' | 'java' | 'C++';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Pattern = 'sliding window' | 'two pointers' | 'tree traversal' | 'graph traversal' | 'dynamic programming' | 'backtracking' | 'greedy' | 'heap' | 'binary search' | 'stack' | 'bit manipulation' | 'matrix' | 'prefix sum';
export type RoadmapDomain = 'MERN Stack' | 'Frontend' | 'Backend' | 'Full Stack' | 'DevOps' | 'Data Science' | 'Machine Learning' | 'Mobile Development' | 'System Design';
export type RoadmapLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type ResourceType = 'article' | 'video' | 'course' | 'documentation' | 'book';
export type MockSessionType = 'company' | 'difficulty' | 'pattern';
export type MockSessionStatus = 'pending' | 'in_progress' | 'completed' | 'expired' | 'abandoned';
export type SubmissionStatus = 'Pending' | 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error' | 'Internal Error';
export type TestCaseStatus = 'passed' | 'failed' | 'error';
export type MentorExpertise = 'DSA' | 'System Design' | 'Frontend' | 'Backend' | 'ML/AI' | 'DevOps' | 'Mobile';
export type BookingType = 'video' | 'chat';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type MeetingProvider = 'jitsi' | 'zoom' | 'google_meet';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

// ==================== USER ====================
export interface IUserSubscription {
    plan: SubscriptionPlan;
    expiresAt?: Date;
    stripeCustomerId?: string;
}

export interface IUserStats {
    totalSubmissions: number;
    acceptedSubmissions: number;
    averageRuntime: number;
    accuracy: number;
    rank?: number;
}

export interface ISocialLinks {
    github?: string;
    linkedin?: string;
    portfolio?: string;
}

export interface IUser extends Document {
    name: string;
    username?: string;
    email: string;
    password: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    passwordChangedAt?: Date;
    bio?: string;
    level: UserLevel;
    languages: ProgrammingLanguage[];
    age?: number;
    role: UserRole;
    isEmailVerified: boolean;
    otp?: string;
    otpExpiry?: Date;
    otpVerified: boolean;
    totalMocksAttempted: number;
    completedMocks: number;
    college?: string;
    companies: string[];
    avatar?: string;
    timezone: string;
    lastLoginAt?: Date;
    subscription: IUserSubscription;
    mentorProfile?: Types.ObjectId;
    solvedProblems: Types.ObjectId[];
    bookmarkedProblems: Types.ObjectId[];
    stats: IUserStats;
    socialLinks: ISocialLinks;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateOTP(): string;
    verifyOTP(otp: string): boolean;
    clearOTP(): void;
    createPasswordResetToken(): string;
}

export interface IUserModel extends Model<IUser> {
    findByEmailorUsername(emailorUsername: string): Promise<IUser | null>;
}

// ==================== PROBLEM ====================
export interface ITestCase {
    input: string;
    output: string;
    explanation?: string;
}

export interface IStarterCode {
    language: string;
    code: string;
}

export interface ISolution {
    language: string;
    code: string;
}

export interface IProblem extends Document {
    title: string;
    description: string;
    difficulty: Difficulty;
    companyTags: string[];
    topics: string[];
    pattern: Pattern[];
    visibleTestCases: ITestCase[];
    hiddenTestCases: Omit<ITestCase, 'explanation'>[];
    starterCode: IStarterCode[];
    solutions: ISolution[];
    constraints?: string;
    hints: string[];
    memoryLimit: number;
    timeLimit: number;
    submissionsCount: number;
    acceptedCount: number;
    createdBy: Types.ObjectId;
    slug?: string;
    premium: boolean;
    likes: number;
    dislikes: number;
    relatedProblems: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

// ==================== SUBMISSION ====================
export interface ITestCaseResult {
    testCaseId: number;
    status: TestCaseStatus;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    runtime?: number;
    memory?: number;
}

export interface ISubmission extends Document {
    user: Types.ObjectId;
    problem: Types.ObjectId;
    mockSession?: Types.ObjectId;
    code: string;
    language: SubmissionLanguage;
    status: SubmissionStatus;
    runtime?: number;
    memory?: number;
    errorMessage?: string;
    testCasesPassed: number;
    testCasesTotal: number;
    testCasesResults: ITestCaseResult[];
    attemptNumber?: number;
    judge0SubmissionId?: string;
    evaluatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== MOCK SESSION ====================
export interface IMockSessionConfig {
    company?: string;
    difficulty?: string;
    pattern?: string;
    problemCount: number;
}

export interface IMockProblem {
    problem: Types.ObjectId;
    order: number;
    submission?: Types.ObjectId;
    timeSpent: number;
    solved: boolean;
    startedAt?: Date;
    completedAt?: Date;
}

export interface IMockScore {
    solved: number;
    total: number;
    totalTime?: number;
    averageTime?: number;
    percentile?: number;
}

export interface IMockSession extends Document {
    user: Types.ObjectId;
    type: MockSessionType;
    config: IMockSessionConfig;
    problems: IMockProblem[];
    timeLimit: number;
    startedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
    status: MockSessionStatus;
    score: IMockScore;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== ROADMAP ====================
export interface IResource {
    title: string;
    url: string;
    type: ResourceType;
    duration?: number;
    isFree: boolean;
}

export interface IModule {
    title: string;
    order: number;
    description?: string;
    topics: string[];
    resources: IResource[];
    problems: Types.ObjectId[];
    prerequisites: Types.ObjectId[];
}

export interface IEnrolledUser {
    user: Types.ObjectId;
    progress: number;
    completedModules: Types.ObjectId[];
    startedAt: Date;
    completedAt?: Date;
    lastAccessedAt: Date;
}

export interface IRoadmapStats {
    totalEnrollments: number;
    averageCompletionTime: number;
    completionRate: number;
    rating: number;
    ratingsCount: number;
}

export interface IRoadmap extends Document {
    title: string;
    slug: string;
    description?: string;
    domain: RoadmapDomain;
    level: RoadmapLevel;
    thumbnail?: string;
    duration?: number;
    modules: IModule[];
    enrolledUsers: IEnrolledUser[];
    stats: IRoadmapStats;
    estimatedDuration?: number;
    isPublished: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== COMPANY ====================
export interface IInterviewProcess {
    rounds?: number;
    typicalDuration?: string;
    stages: string[];
}

export interface ISalaryRange {
    min?: number;
    max?: number;
    currency: string;
}

export interface IDifficultyDistribution {
    easy: number;
    medium: number;
    hard: number;
}

export interface ICompany extends Document {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    hiring: boolean;
    interviewProcess: IInterviewProcess;
    salaryRange: ISalaryRange;
    difficultyDistribution: IDifficultyDistribution;
    popularTopics: string[];
    totalProblems: number;
    mockSessionCount: number;
    averageMockScore: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== MENTOR ====================
export interface ITimeSlot {
    start: string;
    end: string;
}

export interface IAvailability {
    dayOfWeek: number;
    slots: ITimeSlot[];
}

export interface IMentorExperience {
    years?: number;
    currentCompany?: string;
    currentRole?: string;
    pastCompanies: string[];
}

export interface IMentorPricing {
    thirtyMin?: number;
    sixtyMin?: number;
    currency: string;
}

export interface IMentorRating {
    average: number;
    count: number;
}

export interface IMentor extends Document {
    user: Types.ObjectId;
    headline?: string;
    bio?: string;
    expertise: MentorExpertise[];
    experience: IMentorExperience;
    availability: IAvailability[];
    timezone: string;
    pricing: IMentorPricing;
    rating: IMentorRating;
    totalSessions: number;
    totalEarnings: number;
    responseTime?: number;
    verified: boolean;
    verifiedAt?: Date;
    isAcceptingBookings: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== BOOKING ====================
export interface IPayment {
    amount: number;
    currency: string;
    stripePaymentId?: string;
    status: PaymentStatus;
    paidAt?: Date;
}

export interface IStudentFeedback {
    rating?: number;
    review?: string;
    submittedAt?: Date;
}

export interface IBooking extends Document {
    mentor: Types.ObjectId;
    student: Types.ObjectId;
    scheduledAt: Date;
    duration: 30 | 60;
    timezone?: string;
    type: BookingType;
    topic?: string;
    agenda?: string;
    status: BookingStatus;
    meetingLink?: string;
    meetingProvider?: MeetingProvider;
    recordingUrl?: string;
    payment: IPayment;
    studentFeedback: IStudentFeedback;
    mentorNotes?: string;
    cancelledBy?: 'student' | 'mentor' | 'system';
    cancellationReason?: string;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
