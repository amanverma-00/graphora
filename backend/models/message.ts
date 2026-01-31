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
