import mongoose from 'mongoose';

const MemberSubschema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roleInTeam: { type: String, enum: ['owner', 'member'], default: 'member' }
}, { _id: false });

const TeamSchema = new mongoose.Schema({
    name:          { type: String, required: true },
    description:   { type: String, default: '' },
    city:          { type: String, required: true },
    trainingDays:  { type: String, default: '' },
    type:          { type: String, enum: ['5×5', '11×11'], required: true },
    ownerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // власник (owner)
    members:       [MemberSubschema], // кожен учасник з роллю у команді
    joinRequests:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // запити на вступ
}, { timestamps: true });

export default mongoose.model('Team', TeamSchema);
