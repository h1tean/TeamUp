import mongoose from 'mongoose';

const CommentSubschema = new mongoose.Schema({
    authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const FileSubschema = new mongoose.Schema({
    url:  { type: String, required: true },
    type: { type: String, enum: ['image','video'], required: true }
}, { _id: false });

const PostSchema = new mongoose.Schema({
    authorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:   { type: String, required: true, maxlength: 3000 },
    createdAt: { type: Date, default: Date.now },
    files:     [FileSubschema],
    likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments:  [CommentSubschema]
});

export default mongoose.model('Post', PostSchema);
