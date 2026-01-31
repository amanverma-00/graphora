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