import { Router } from 'express';
import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.js';

const router = Router();

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) {
            return res.status(400).json({ success: false, error: 'roomId є обов’язковим.' });
        }

        // Знайдемо всі повідомлення в цій кімнаті, відсортуємо за часом
        const messages = await ChatMessage.find({ roomId })
            .sort({ timestamp: 1 })
            .lean();

        return res.status(200).json({ success: true, messages });
    } catch (err) {
        console.error('[Chat][GET /:roomId]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання повідомлень.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { roomId, authorId, text, fileUrl, fileType } = req.body;

        if (!roomId || !authorId) {
            return res.status(400).json({ success: false, error: 'Поля roomId та authorId є обов’язковими.' });
        }
        if (fileType && !['image', 'video', 'other'].includes(fileType)) {
            return res.status(400).json({ success: false, error: 'fileType має бути "image", "video" або "other".' });
        }

        const newMessage = new ChatMessage({
            roomId,
            authorId,
            text: text || null,
            fileUrl: fileUrl || null,
            fileType: fileType || null,
            timestamp: Date.now(),
            edited: false
        });

        await newMessage.save();

        return res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
        console.error('[Chat][POST /]', err);
        return res.status(500).json({ success: false, error: 'Помилка створення повідомлення.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID повідомлення.' });
        }
        if (!text) {
            return res.status(400).json({ success: false, error: 'Текст є обов’язковим.' });
        }

        const message = await ChatMessage.findById(id);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Повідомлення не знайдено.' });
        }

        message.text = text;
        message.edited = true;
        await message.save();

        return res.status(200).json({ success: true, message });
    } catch (err) {
        console.error('[Chat][PUT /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка оновлення повідомлення.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID повідомлення.' });
        }

        const deleted = await ChatMessage.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Повідомлення не знайдено.' });
        }

        return res.status(200).json({ success: true, message: 'Повідомлення успішно видалене.' });
    } catch (err) {
        console.error('[Chat][DELETE /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка видалення повідомлення.' });
    }
});

export default router;
