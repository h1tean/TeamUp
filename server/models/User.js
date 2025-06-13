import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    firstName:               { type: String, required: true },
    lastName:                { type: String, required: true },
    phone:                   { type: String, required: true, unique: true },
    passwordHash:            { type: String, required: true },
    role:                    { type: String, enum: ['player', 'owner', 'admin'], default: 'player' },
    about:                   { type: String, default: '' },
    avatarUrl:               { type: String, default: '' },
    birthDate:               { type: Date, required: true },
    friends:                 [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    incomingFriendRequests:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    outgoingFriendRequests:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teams:                   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    verificationCode:        { type: String },
    verificationCodeExpires: { type: Date },
    verified:                { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
