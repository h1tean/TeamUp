import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    fieldId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
    bookedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookedByTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    startTime:      { type: Date, required: true },
    endTime:        { type: Date, required: true },
    status:         { type: String, enum: ['pending','confirmed','canceled'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Booking', BookingSchema);
