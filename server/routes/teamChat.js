import { Router } from 'express';
import TeamChatMessage from '../models/TeamChatMessage.js';
import multer from 'multer';
import path from 'path';
import authMiddleware from '../middleware/auth.js';
import fs from 'fs';


const router = Router();
const upload = multer({ dest: 'uploads/team-chat/' });

router.get('/:teamId/messages', authMiddleware, async (req, res) => {
    try {
        const msgs = await TeamChatMessage.find({ teamId: req.params.teamId })
            .sort({ createdAt: 1 })
            .lean();
        res.json({ success: true, messages: msgs });
    } catch {
        res.status(500).json({ error: 'Не вдалося отримати історію чату.' });
    }
});

router.post('/:teamId/message', authMiddleware, async (req, res) => {
    try {
        const { text, fileUrl, fileType } = req.body;
        const message = new TeamChatMessage({
            teamId: req.params.teamId,
            userId: req.user.id,
            author: req.user.firstName + ' ' + req.user.lastName,
            text,
            fileUrl,
            fileType
        });
        await message.save();
        res.json({ success: true, message });
    } catch {
        res.status(500).json({ error: 'Не вдалося зберегти повідомлення.' });
    }
});

router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не отримано' });
    const ext = path.extname(req.file.originalname);
    const url = `/static/team-chat/${req.file.filename}${ext}`;
    // Перейменувати файл для збереження розширення
    fs.renameSync(req.file.path, `uploads/team-chat/${req.file.filename}${ext}`);
    res.json({ success: true, url });
});

export default router;
