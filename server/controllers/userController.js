import User from '../models/User.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('uploads', 'avatars'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.params.id}_${Date.now()}${ext}`);
    }
});
export const uploadAvatar = multer({ storage });

export const postAvatar = async (req, res) => {
    try {
        const userId = req.params.id;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        // Повертаємо публічний URL
        const avatarUrl = `/static/avatars/${file.filename}`;

        // Зберігаємо в базу
        await User.findByIdAndUpdate(userId, { avatarUrl });

        res.json({ avatarUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
