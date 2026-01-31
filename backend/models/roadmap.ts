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