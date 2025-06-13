import { Router } from 'express';
import mongoose from 'mongoose';
import Field from '../models/Field.js';
import User from '../models/User.js';

const router = Router();

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (req, res) => {
    try {
        const fields = await Field.find()
            .populate('ownerId', 'firstName lastName phone')
            .lean();
        return res.status(200).json({ success: true, fields });
    } catch (err) {
        console.error('[Fields][GET /]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання полів.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID поля.' });
        }

        const field = await Field.findById(id)
            .populate('ownerId', 'firstName lastName phone')
            .lean();

        if (!field) {
            return res.status(404).json({ success: false, error: 'Поле не знайдено.' });
        }

        return res.status(200).json({ success: true, field });
    } catch (err) {
        console.error('[Fields][GET /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання поля.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, type, location, slots, images, ownerId } = req.body;

        if (!name || !type || !location || !ownerId) {
            return res.status(400).json({ success: false, error: 'Поля name, type, location та ownerId є обов’язковими.' });
        }
        if (!['5x5', '11x11'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Некоректний тип поля (type має бути 5x5 або 11x11).' });
        }
        if (!isValidObjectId(ownerId)) {
            return res.status(400).json({ success: false, error: 'Некоректний ownerId.' });
        }

        const ownerExists = await User.exists({ _id: ownerId });
        if (!ownerExists) {
            return res.status(404).json({ success: false, error: 'Користувача-власника не знайдено.' });
        }

        const newField = new Field({
            name,
            type,
            location,
            slots: Array.isArray(slots) ? slots : [],
            images: Array.isArray(images) ? images : [],
            ownerId
        });

        await newField.save();

        const created = await Field.findById(newField._id)
            .populate('ownerId', 'firstName lastName phone')
            .lean();

        return res.status(201).json({ success: true, field: created });
    } catch (err) {
        console.error('[Fields][POST /]', err);
        return res.status(500).json({ success: false, error: 'Помилка створення поля.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID поля.' });
        }

        if (updates.ownerId && !isValidObjectId(updates.ownerId)) {
            return res.status(400).json({ success: false, error: 'Некоректний ownerId.' });
        }

        if (updates.ownerId) {
            const ownerExists = await User.exists({ _id: updates.ownerId });
            if (!ownerExists) {
                return res.status(404).json({ success: false, error: 'Користувача-власника не знайдено.' });
            }
        }

        if (updates.type && !['5x5', '11x11'].includes(updates.type)) {
            return res.status(400).json({ success: false, error: 'Некоректний тип поля.' });
        }

        const field = await Field.findById(id);
        if (!field) {
            return res.status(404).json({ success: false, error: 'Поле не знайдено.' });
        }

        if (updates.name !== undefined) field.name = updates.name;
        if (updates.type !== undefined) field.type = updates.type;
        if (updates.location !== undefined) field.location = updates.location;
        if (updates.slots !== undefined && Array.isArray(updates.slots)) field.slots = updates.slots;
        if (updates.images !== undefined && Array.isArray(updates.images)) field.images = updates.images;
        if (updates.ownerId !== undefined) field.ownerId = updates.ownerId;

        await field.save();

        const updated = await Field.findById(id)
            .populate('ownerId', 'firstName lastName phone')
            .lean();

        return res.status(200).json({ success: true, field: updated });
    } catch (err) {
        console.error('[Fields][PUT /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка оновлення поля.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID поля.' });
        }

        const deleted = await Field.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Поле не знайдено.' });
        }

        return res.status(200).json({ success: true, message: 'Поле успішно видалено.' });
    } catch (err) {
        console.error('[Fields][DELETE /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка видалення поля.' });
    }
});

export default router;
