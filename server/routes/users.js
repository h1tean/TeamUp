import { Router } from 'express';
import { uploadAvatar, postAvatar } from '../controllers/userController.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

import Post from '../models/Post.js';

const router = Router();

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
            return res.status(409).json({ error: 'Користувач із таким телефоном вже існує.' });
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
            outgoingFriendRequests: []
        });
        await newUser.save();

        return res.status(201).json({
            success: true,
            user: {
                id:         newUser._id.toString(),
                firstName:  newUser.firstName,
                lastName:   newUser.lastName,
                phone:      newUser.phone,
                birthDate:  newUser.birthDate,
                role:       newUser.role,
                about:      newUser.about,
                avatarUrl:  newUser.avatarUrl
            }
        });
    } catch (err) {
        console.error('[Users][Register] Error:', err);
        return res.status(500).json({ error: 'Server error при реєстрації.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ error: 'Потрібно вказати phone та password.' });
        }
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Невірний пароль.' });
        }
        return res.json({
            success: true,
            user: {
                id:         user._id.toString(),
                firstName:  user.firstName,
                lastName:   user.lastName,
                phone:      user.phone,
                role:       user.role,
                about:      user.about,
                avatarUrl:  user.avatarUrl
            }
        });
    } catch (err) {
        console.error('[Users][Login] Error:', err);
        return res.status(500).json({ error: 'Server error при логіні.' });
    }
});


router.get('/', async (req, res) => {
    try {
        const raw = await User.find()
            .select('firstName lastName phone avatarUrl')
            .lean();
        const users = raw.map(u => ({
            id:         u._id.toString(),
            firstName:  u.firstName,
            lastName:   u.lastName,
            phone:      u.phone,
            avatarUrl:  u.avatarUrl
        }));
        return res.json({ success: true, users });
    } catch (err) {
        console.error('[Users][GetAll] Error:', err);
        return res.status(500).json({ error: 'Server error при отриманні списку користувачів.' });
    }
});


router.post('/:id/avatar', uploadAvatar.single('avatar'), postAvatar);

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
        return res.json({ success: true, user: updated });
    } catch (err) {
        console.error('[Users][Update] Error:', err);
        return res.status(500).json({ error: 'Server error при оновленні профілю.' });
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
        const sender    = await User.findById(fromUserId);
        if (!recipient || !sender) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        if (recipient.friends.includes(fromUserId)) {
            return res.status(400).json({ error: 'Вже друзі.' });
        }
        const already = recipient.incomingFriendRequests
            .some(oid => oid.toString() === fromUserId);
        if (already) {
            return res.status(400).json({ error: 'Запит уже надіслано.' });
        }
        recipient.incomingFriendRequests.push(fromUserId);
        sender.outgoingFriendRequests.push(id);
        await recipient.save();
        await sender.save();
        return res.json({ success: true, message: 'Запит надіслано.' });
    } catch (err) {
        console.error('[Users][FriendRequest] Error:', err);
        return res.status(500).json({ error: 'Server error при надсиланні запиту.' });
    }
});


router.post('/:id/friend-request/accept', async (req, res) => {
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
        const sender    = await User.findById(fromUserId);
        if (!recipient || !sender) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        const hasRequest = recipient.incomingFriendRequests
            .some(oid => oid.toString() === fromUserId);
        if (!hasRequest) {
            return res.status(400).json({ error: 'Немає запиту.' });
        }
        recipient.incomingFriendRequests = recipient.incomingFriendRequests
            .filter(oid => oid.toString() !== fromUserId);
        sender.outgoingFriendRequests = sender.outgoingFriendRequests
            .filter(oid => oid.toString() !== id);
        recipient.friends.push(fromUserId);
        sender.friends.push(id);
        await recipient.save();
        await sender.save();
        return res.json({ success: true, message: 'Запит прийнято.' });
    } catch (err) {
        console.error('[Users][FriendAccept] Error:', err);
        return res.status(500).json({ error: 'Server error при прийнятті запиту.' });
    }
});

router.post('/:id/friend-request/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { fromUserId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(fromUserId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        if (id === fromUserId) {
            return res.status(400).json({ error: 'Не можна відхилити власний запит.' });
        }
        const recipient = await User.findById(id);
        const sender    = await User.findById(fromUserId);
        if (!recipient || !sender) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        const hasRequest = recipient.incomingFriendRequests
            .some(oid => oid.toString() === fromUserId);
        if (!hasRequest) {
            return res.status(400).json({ error: 'Немає запиту.' });
        }
        recipient.incomingFriendRequests = recipient.incomingFriendRequests
            .filter(oid => oid.toString() !== fromUserId);
        sender.outgoingFriendRequests = sender.outgoingFriendRequests
            .filter(oid => oid.toString() !== id);
        await recipient.save();
        await sender.save();
        return res.json({ success: true, message: 'Запит відхилено.' });
    } catch (err) {
        console.error('[Users][FriendReject] Error:', err);
        return res.status(500).json({ error: 'Server error при відхиленні запиту.' });
    }
});


router.get('/:id/friends', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }

        // Завантажуємо користувача разом із друзями
        const user = await User.findById(id)
            .populate('friends', 'firstName lastName phone avatarUrl');

        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }

        // Маппінг кожного друга з _id → id
        const friends = user.friends.map(u => ({
            id:        u._id.toString(),
            firstName: u.firstName,
            lastName:  u.lastName,
            phone:     u.phone,
            avatarUrl: u.avatarUrl
        }));

        return res.json({ success: true, friends });
    } catch (err) {
        console.error('[Users][GetFriends] Error:', err);
        return res.status(500).json({ error: 'Server error при отриманні друзів.' });
    }
});

router.get('/:id/requests', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const user = await User.findById(id)
            .populate('incomingFriendRequests', 'firstName lastName phone avatarUrl')
            .populate('outgoingFriendRequests', 'firstName lastName phone avatarUrl');
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        const incoming = user.incomingFriendRequests.map(u => ({
            id:        u._id.toString(),
            firstName: u.firstName,
            lastName:  u.lastName,
            phone:     u.phone,
            avatarUrl: u.avatarUrl
        }));
        const outgoing = user.outgoingFriendRequests.map(u => ({
            id:        u._id.toString(),
            firstName: u.firstName,
            lastName:  u.lastName,
            phone:     u.phone,
            avatarUrl: u.avatarUrl
        }));
        return res.json({ success: true, incoming, outgoing });
    } catch (err) {
        console.error('[Users][GetRequests] Error:', err);
        return res.status(500).json({ error: 'Server error при отриманні запитів.' });
    }
});



router.delete('/:id/friends/:friendId', async (req, res) => {
    try {
        const { id, friendId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(friendId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        if (id === friendId) {
            return res.status(400).json({ error: 'Не можна видалити себе.' });
        }
        const user   = await User.findById(id);
        const friend = await User.findById(friendId);
        if (!user || !friend) {
            return res.status(404).json({ error: 'Користувача не знайдено.' });
        }
        user.friends   = user.friends.filter(f => f.toString() !== friendId);
        friend.friends = friend.friends.filter(f => f.toString() !== id);
        await user.save();
        await friend.save();
        return res.json({ success: true, message: 'Друг видалений.' });
    } catch (err) {
        console.error('[Users][DeleteFriend] Error:', err);
        return res.status(500).json({ error: 'Server error при видаленні друга.' });
    }
});


router.get('/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const posts = await Post.find({ authorId: id })
            .sort({ createdAt: -1 })
            .populate('authorId', 'firstName lastName avatarUrl')
            .populate('comments.authorId', 'firstName lastName avatarUrl')
            .lean();
        return res.json(posts);
    } catch (err) {
        console.error('[Users][GetPosts] Error:', err);
        return res.status(500).json({ error: 'Server error при отриманні постів.' });
    }
});

router.post('/:id/posts', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user._id.toString() !== id) {
            return res.status(403).json({ error: 'Дозволено лише для власного профілю.' });
        }
        const { content, files } = req.body;
        if (!content || typeof content !== 'string') {
            return res.status(400).json({ error: 'Поле content обовʼязкове.' });
        }
        const newPost = new Post({
            authorId: id,
            content,
            files: Array.isArray(files) ? files : [],
            comments: [],
            likes: []
        });
        await newPost.save();
        const populated = await Post.findById(newPost._id)
            .populate('authorId', 'firstName lastName avatarUrl')
            .populate('comments.authorId', 'firstName lastName avatarUrl')
            .lean();
        return res.status(201).json(populated);
    } catch (err) {
        console.error('[Users][CreatePost] Error:', err);
        return res.status(500).json({ error: 'Server error при створенні поста.' });
    }
});

router.put('/:id/posts/:postId', authMiddleware, async (req, res) => {
    try {
        const { id, postId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(postId)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Пост не знайдено.' });
        if (post.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Можна редагувати лише свої пости.' });
        }
        const { content, files } = req.body;
        if (typeof content === 'string') post.content = content;
        if (Array.isArray(files)) post.files = files;
        await post.save();
        const populated = await Post.findById(post._id)
            .populate('authorId', 'firstName lastName avatarUrl')
            .populate('comments.authorId', 'firstName lastName avatarUrl')
            .lean();
        return res.json(populated);
    } catch (err) {
        console.error('[Users][UpdatePost] Error:', err);
        return res.status(500).json({ error: 'Server error при оновленні поста.' });
    }
});

router.delete('/:id/posts/:postId', authMiddleware, async (req, res) => {
    try {
        const { id, postId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(postId)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Пост не знайдено.' });
        if (post.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Можна видаляти лише свої пости.' });
        }
        await post.deleteOne();
        return res.sendStatus(204);
    } catch (err) {
        console.error('[Users][DeletePost] Error:', err);
        return res.status(500).json({ error: 'Server error при видаленні поста.' });
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
        return res.json({
            success: true,
            user: {
                id:        user._id.toString(),
                firstName: user.firstName,
                lastName:  user.lastName,
                phone:     user.phone,
                role:      user.role,
                about:     user.about,
                avatarUrl: user.avatarUrl,
                friends:             user.friends.map(u => ({
                    id: u._id.toString(),
                    firstName: u.firstName,
                    lastName: u.lastName,
                    phone: u.phone,
                    avatarUrl: u.avatarUrl
                })),
                incomingFriendRequests: user.incomingFriendRequests.map(u => ({
                    id: u._id.toString(),
                    firstName: u.firstName,
                    lastName: u.lastName,
                    phone: u.phone,
                    avatarUrl: u.avatarUrl
                })),
                outgoingFriendRequests: user.outgoingFriendRequests.map(u => ({
                    id: u._id.toString(),
                    firstName: u.firstName,
                    lastName: u.lastName,
                    phone: u.phone,
                    avatarUrl: u.avatarUrl
                }))
            }
        });
    } catch (err) {
        console.error('[Users][GetById] Error:', err);
        return res.status(500).json({ error: 'Server error при отриманні користувача.' });
    }
});

export default router;
