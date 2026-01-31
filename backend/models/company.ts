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