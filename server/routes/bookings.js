import { Router } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Field from '../models/Field.js';

const router = Router();

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/bookings
 * Отримати всі бронювання (за датою, від найновіших)
 */
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.fieldId && isValidObjectId(req.query.fieldId)) {
            filter.fieldId = req.query.fieldId;
        }
        if (req.query.userId && isValidObjectId(req.query.userId)) {
            filter.bookedByUserId = req.query.userId;
        }
        if (req.query.date) {
            const startDay = new Date(req.query.date + "T00:00:00.000Z");
            const endDay = new Date(req.query.date + "T23:59:59.999Z");
            filter.startTime = { $gte: startDay, $lte: endDay };
        }

        const bookings = await Booking.find(filter)
            .sort({ startTime: -1 })
            .populate('bookedByUserId', 'firstName lastName phone')
            .populate('bookedByTeamId', 'name')
            .populate('fieldId', 'name location')
            .lean();
        return res.status(200).json({ success: true, bookings });
    } catch (err) {
        console.error('[Bookings][GET /]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання бронювань.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID бронювання.' });
        }

        const booking = await Booking.findById(id)
            .populate('bookedByUserId', 'firstName lastName phone')
            .populate('bookedByTeamId', 'name')
            .populate('fieldId', 'name location')
            .lean();

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Бронювання не знайдено.' });
        }

        return res.status(200).json({ success: true, booking });
    } catch (err) {
        console.error('[Bookings][GET /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання бронювання.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { fieldId, bookedByUserId, bookedByTeamId, startTime, endTime } = req.body;

        if (!fieldId || !isValidObjectId(fieldId)) {
            return res.status(400).json({ success: false, error: 'Поле fieldId є обов’язковим і має бути коректним ObjectId.' });
        }
        if (!startTime || !endTime) {
            return res.status(400).json({ success: false, error: 'startTime та endTime є обов’язковими.' });
        }
        if (!bookedByUserId && !bookedByTeamId) {
            return res.status(400).json({ success: false, error: 'Потрібно вказати або bookedByUserId, або bookedByTeamId.' });
        }
        if (bookedByUserId && !isValidObjectId(bookedByUserId)) {
            return res.status(400).json({ success: false, error: 'Некоректний bookedByUserId.' });
        }
        if (bookedByTeamId && !isValidObjectId(bookedByTeamId)) {
            return res.status(400).json({ success: false, error: 'Некоректний bookedByTeamId.' });
        }

        const fieldExists = await Field.exists({ _id: fieldId });
        if (!fieldExists) {
            return res.status(404).json({ success: false, error: 'Поле не знайдено.' });
        }
        if (bookedByUserId) {
            const userExists = await User.exists({ _id: bookedByUserId });
            if (!userExists) {
                return res.status(404).json({ success: false, error: 'Користувача не знайдено.' });
            }
        }
        if (bookedByTeamId) {
            const teamExists = await Team.exists({ _id: bookedByTeamId });
            if (!teamExists) {
                return res.status(404).json({ success: false, error: 'Команду не знайдено.' });
            }
        }

        if (bookedByUserId) {
            const exists = await Booking.exists({
                fieldId,
                bookedByUserId,
                startTime: new Date(startTime),
                endTime: new Date(endTime)
            });
            if (exists) {
                return res.status(400).json({ success: false, error: 'Ви вже забронювали цей слот!' });
            }
        }

        const bookingDoc = new Booking({
            fieldId,
            bookedByUserId: bookedByUserId || null,
            bookedByTeamId: bookedByTeamId || null,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: 'pending'
        });

        await bookingDoc.save();

        const created = await Booking.findById(bookingDoc._id)
            .populate('bookedByUserId', 'firstName lastName phone')
            .populate('bookedByTeamId', 'name')
            .populate('fieldId', 'name location')
            .lean();

        return res.status(201).json({ success: true, booking: created });
    } catch (err) {
        console.error('[Bookings][POST /]', err);
        return res.status(500).json({ success: false, error: 'Помилка створення бронювання.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID бронювання.' });
        }

        if (updates.status && !['pending', 'confirmed', 'canceled'].includes(updates.status)) {
            return res.status(400).json({ success: false, error: 'Недопустимий статус.' });
        }
        if (updates.startTime && isNaN(Date.parse(updates.startTime))) {
            return res.status(400).json({ success: false, error: 'Некоректний формат startTime.' });
        }
        if (updates.endTime && isNaN(Date.parse(updates.endTime))) {
            return res.status(400).json({ success: false, error: 'Некоректний формат endTime.' });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, error: 'Бронювання не знайдено.' });
        }

        if (updates.startTime) booking.startTime = new Date(updates.startTime);
        if (updates.endTime) booking.endTime = new Date(updates.endTime);
        if (updates.status) booking.status = updates.status;

        await booking.save();

        const updated = await Booking.findById(id)
            .populate('bookedByUserId', 'firstName lastName phone')
            .populate('bookedByTeamId', 'name')
            .populate('fieldId', 'name location')
            .lean();

        return res.status(200).json({ success: true, booking: updated });
    } catch (err) {
        console.error('[Bookings][PUT /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка оновлення бронювання.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID бронювання.' });
        }

        const deleted = await Booking.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Бронювання не знайдено.' });
        }

        return res.status(200).json({ success: true, message: 'Бронювання успішно видалено.' });
    } catch (err) {
        console.error('[Bookings][DELETE /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка видалення бронювання.' });
    }
});

export default router;
