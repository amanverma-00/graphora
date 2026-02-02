import mongoose, { Schema } from 'mongoose';
import { IConversation, IMessage } from '../types/type';

const ConversationSchema = new Schema<IConversation>({
    participants: [{ type: Schema.Types.ObjectId, ref:'User' }],
    type: { type: String, enum: ['direct','group','mentor'], default:'direct' },
    booking: { type: Schema.Types.ObjectId, ref:'Booking' },// If mentor chat
    lastMessage: {
        content: String,
        sender: { type: Schema.Types.ObjectId, ref:'User' },
        sentAt: Date
    },
    unreadCount: { type: Map, of: Number }
}, { timestamps: true });

const MessageSchema = new Schema<IMessage>({
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

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ 'lastMessage.sentAt': -1 });
MessageSchema.index({ conversation: 1, createdAt: -1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.model('Message', MessageSchema);

export { Conversation, Message };
export default Message;
