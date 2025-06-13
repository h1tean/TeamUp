import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const TestSchema = new mongoose.Schema({
    message: { type: String, default: 'Привіт від MongoDB!' },
    createdAt: { type: Date, default: Date.now }
});
const TestModel = mongoose.model('Test', TestSchema);

router.get('/', async (req, res) => {
    try {
        const newDoc = await TestModel.create({});
        return res.status(200).json({ success: true, doc: newDoc });
    } catch (err) {
        console.error('[TestDbRoute] Помилка створення документа:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
