import mongoose from 'mongoose';

const TeamChatMessageSchema = new mongoose.Schema({
    teamId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author:    { type: String, required: true },
    text:      { type: String },
    fileUrl:   { type: String },
    fileType:  { type: String }, // image, video, other
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TeamChatMessage', TeamChatMessageSchema);
