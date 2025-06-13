import mongoose from 'mongoose';

const SlotSubschema = new mongoose.Schema({
    start: { type: String, required: true }, // наприклад "09:00"
    end:   { type: String, required: true }  // наприклад "10:00"
}, { _id: false });

const FieldSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    type:         { type: String, enum: ['5x5', '11x11'], required: true },
    location:     { type: String, required: true },
    slots:        [SlotSubschema],
    images:       [{ type: String }],
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Field', FieldSchema);
