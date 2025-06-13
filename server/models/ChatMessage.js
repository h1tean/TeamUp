import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    roomId:    { type: String, required: true }, // наприклад "u1_u2" або "team_<teamId>"
    authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:      { type: String },
    fileUrl:   { type: String },
    fileType:  { type: String, enum: ['image','video','other'] },
    timestamp: { type: Date, default: Date.now },
    edited:    { type: Boolean, default: false }
});

export default mongoose.model('ChatMessage', ChatMessageSchema);
