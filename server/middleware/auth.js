import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

export default async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Токен авторизації відсутній.' });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Невірний або прострочений токен.' });
    }

    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
        return res.status(400).json({ error: 'Некоректний ID у токені.' });
    }

    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) {
        return res.status(404).json({ error: 'Користувача не знайдено.' });
    }

    req.user = user;
    next();
}
