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