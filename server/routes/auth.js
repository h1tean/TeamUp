import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import twilio from 'twilio';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, phone, password, confirmPassword, birthDate } = req.body;
        if (!firstName || !lastName || !phone || !password || !confirmPassword || !birthDate) {
            return res.status(400).json({ error: 'Усі поля обовʼязкові.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Паролі не збігаються.' });
        }
        const existing = await User.findOne({ phone });
        if (existing) {
            return res.status(409).json({ error: 'Користувач із таким телефоном уже існує.' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({
            firstName,
            lastName,
            phone,
            passwordHash,
            birthDate: new Date(birthDate),
            about: '',
            avatarUrl: '',
            friends: [],
            incomingFriendRequests: [],
            outgoingFriendRequests: [],
            savedPosts: [],
            verified: false,
            verificationCode: undefined,
            verificationCodeExpires: undefined
        });
        await newUser.save();
        return res.status(201).json({
            success: true,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phone: newUser.phone,
                birthDate: newUser.birthDate,
                role: newUser.role,
                about: newUser.about,
                avatarUrl: newUser.avatarUrl
            }
        });
    } catch (err) {
        console.error('[Users][Register] Error:', err);
        res.status(500).json({ error: 'Server error при реєстрації.' });
    }
});

router.post('/send-code', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        if (!isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid userId' });

        const user = await User.findById(userId);
        if (!user || user.verified) return res.status(404).json({ error: 'No pending user' });

        const code = String(Math.floor(100000 + Math.random() * 900000));
        user.verificationCode = code;
        user.verificationCodeExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: user.phone, channel: 'sms' });

        return res.json({ success: true, message: 'Code sent' });
    } catch (err) {
        console.error('[Auth][Send Code] Error:', err);
        return res.status(500).json({ error: 'Server error при відправці коду.' });
    }
});

router.post('/verify-code', async (req, res) => {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            return res.status(400).json({ error: 'userId and code are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({ to: user.phone, code });

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ error: 'Невірний код або термін його дії минув.' });
        }

        user.verified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                about: user.about,
                avatarUrl: user.avatarUrl
            }
        });

    } catch (err) {
        console.error('[Auth][VerifyCode] Error:', err);
        res.status(500).json({ error: 'Помилка сервера при верифікації.' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'phone is required' });

        // знайти користувача за телефоном
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // згенерувати код (можете поки що простий рандом)
        const code = String(Math.floor(100000 + Math.random() * 900000));
        user.verificationCode = code;
        user.verificationCodeExpires = Date.now() + 5*60*1000;  // 5 хв
        await user.save();

        // надсилання через Twilio Verify або SMS
        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({ to: user.phone, channel: 'sms' });

        return res.json({ success: true, message: 'Code sent' });
    } catch (err) {
        console.error('[Auth][Forgot Password] Error:', err);
        return res.status(500).json({ error: 'Server error при відправці коду.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { phone, code, newPassword } = req.body;
        if (!phone || !code || !newPassword)
            return res.status(400).json({ error: 'phone, code і newPassword обовʼязкові' });


        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ error: 'User not found' });


        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({ to: user.phone, code });

        if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ error: 'Невірний код або термін дії минув' });
        }


        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.json({ success: true, message: 'Password changed' });
    } catch (err) {
        console.error('[Auth][Reset Password] Error:', err);
        return res.status(500).json({ error: 'Server error при зміні пароля.' });
    }
});


router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Auth][Me] Error:', err);
        res.status(500).json({ error: 'Помилка сервера при отриманні користувача.' });
    }
});

router.post('/login', async (req, res) => {
        try {
               const { phone, password } = req.body;
               if (!phone || !password) {
                        return res.status(400).json({ error: 'Телефон і пароль обовʼязкові.' });
                   }
        const user = await User.findOne({ phone });
                if (!user) {
                        return res.status(404).json({ error: 'Користувача не знайдено.' });
                   }
                 if (!user.verified) {
                         return res.status(401).json({ error: 'Акаунт не підтверджено.' });
                    }
               const isMatch = await bcrypt.compare(password, user.passwordHash);
               if (!isMatch) {
                        return res.status(401).json({ error: 'Невірний пароль.' });
                   }

                         const token = jwt.sign(
                       { userId: user._id },
                       process.env.JWT_SECRET,
                      { expiresIn: '7d' }
                   );

                         return res.json({
                         success: true,
                         token,
                         user: {
                          id: user._id,
                                 firstName: user.firstName,
                                 lastName: user.lastName,
                                 phone: user.phone,
                                 role: user.role,
                                about: user.about,
                                avatarUrl: user.avatarUrl
            }
        });
        } catch (err) {
        console.error('[Users][Login] Error:', err);
        res.status(500).json({ error: 'Server error при логіні.' });
        }
    });

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const user = await User.findById(id)
            .select('-passwordHash')
            .populate('friends', 'firstName lastName phone avatarUrl')
            .populate('incomingFriendRequests', 'firstName lastName phone avatarUrl')
            .populate('outgoingFriendRequests', 'firstName lastName phone avatarUrl');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Users][GetById] Error:', err);
        res.status(500).json({ error: 'Server error при отриманні користувача.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const { about, avatarUrl } = req.body;
        const updates = {};
        if (typeof about === 'string') updates.about = about;
        if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl;
        const updated = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-passwordHash');
        if (!updated) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        res.json({ success: true, user: updated });
    } catch (err) {
        console.error('[Users][Update] Error:', err);
        res.status(500).json({ error: 'Server error при оновленні профілю.' });
    }
});



router.post('/:id/friend-request', async (req, res) => {
    try {
        const { id } = req.params;
        const { fromUserId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(fromUserId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        if (id === fromUserId) {
            return res.status(400).json({ error: 'Не можна додати себе.' });
        }
        const recipient = await User.findById(id);
        const sender = await User.findById(fromUserId);
        if (!recipient || !sender) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        if (recipient.friends.includes(fromUserId)) return res.status(400).json({ error: 'Вже друзі.' });
        if (recipient.incomingFriendRequests.includes(fromUserId)) return res.status(400).json({ error: 'Запит уже надіслано.' });
        recipient.incomingFriendRequests.push(fromUserId);
        sender.outgoingFriendRequests.push(id);
        await recipient.save();
        await sender.save();
        res.json({ success: true, message: 'Запит надіслано.' });
    } catch (err) {
        console.error('[Users][FriendRequest] Error:', err);
        res.status(500).json({ error: 'Server error при надсиланні запиту.' });
    }
});

router.post('/:id/friend-request/accept', async (req, res) => {
    try {
        const { id } = req.params;
        const { fromUserId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(fromUserId)) return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        const recipient = await User.findById(id);
        const sender = await User.findById(fromUserId);
        if (!recipient || !sender) return res.status(404).json({ error: 'Користувача не знайдено.' });
        if (!recipient.incomingFriendRequests.includes(fromUserId)) return res.status(400).json({ error: 'Немає запиту.' });
        recipient.incomingFriendRequests = recipient.incomingFriendRequests.filter(u => u.toString() !== fromUserId);
        sender.outgoingFriendRequests = sender.outgoingFriendRequests.filter(u => u.toString() !== id);
        recipient.friends.push(fromUserId);
        sender.friends.push(id);
        await recipient.save();
        await sender.save();
        res.json({ success: true, message: 'Запит прийнято.' });
    } catch (err) {
        console.error('[Users][FriendAccept] Error:', err);
        res.status(500).json({ error: 'Server error при прийнятті.' });
    }
});

router.post('/:id/friend-request/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { fromUserId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(fromUserId)) return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        const recipient = await User.findById(id);
        const sender = await User.findById(fromUserId);
        if (!recipient || !sender) return res.status(404).json({ error: 'Користувача не знайдено.' });
        if (!recipient.incomingFriendRequests.includes(fromUserId)) return res.status(400).json({ error: 'Немає запиту.' });
        recipient.incomingFriendRequests = recipient.incomingFriendRequests.filter(u => u.toString() !== fromUserId);
        sender.outgoingFriendRequests = sender.outgoingFriendRequests.filter(u => u.toString() !== id);
        await recipient.save();
        await sender.save();
        res.json({ success: true, message: 'Запит відхилено.' });
    } catch (err) {
        console.error('[Users][FriendReject] Error:', err);
        res.status(500).json({ error: 'Server error при відхиленні.' });
    }
});

router.get('/:id/friends', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ error: 'Невірний формат ID.' });
        const user = await User.findById(id).populate('friends', 'firstName lastName phone avatarUrl');
        if (!user) return res.status(404).json({ error: 'Користувача не знайдено.' });
        res.json({ success: true, friends: user.friends });
    } catch (err) {
        console.error('[Users][GetFriends] Error:', err);
        res.status(500).json({ error: 'Server error при отриманні друзів.' });
    }
});

router.get('/:id/requests', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ error: 'Невірний формат ID.' });
        const user = await User.findById(id)
            .populate('incomingFriendRequests', 'firstName lastName phone avatarUrl')
            .populate('outgoingFriendRequests', 'firstName lastName phone avatarUrl');
        if (!user) return res.status(404).json({ error: 'Користувача не знайдено.' });
        res.json({ success: true, incoming: user.incomingFriendRequests, outgoing: user.outgoingFriendRequests });
    } catch (err) {
        console.error('[Users][GetRequests] Error:', err);
        res.status(500).json({ error: 'Server error при отриманні запитів.' });
    }
});

export default router;
