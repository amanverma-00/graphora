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
