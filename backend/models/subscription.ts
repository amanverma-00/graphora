import mongoose, { Schema } from 'mongoose';
import { ISubscription } from '../types/type';

const SubscriptionSchema = new Schema<ISubscription>({
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
}, { timestamps: true });

SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
