import { Router } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';

const router = Router();

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('authorId', 'firstName lastName avatarUrl')
            .lean();
        return res.status(200).json({ success: true, posts });
    } catch (err) {
        console.error('[Posts][GET /]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання постів.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID поста.' });
        }

        const post = await Post.findById(id)
            .populate('authorId', 'firstName lastName avatarUrl')
            .populate('comments.authorId', 'firstName lastName avatarUrl')
            .lean();

        if (!post) {
            return res.status(404).json({ success: false, error: 'Пост не знайдено.' });
        }

        return res.status(200).json({ success: true, post });
    } catch (err) {
        console.error('[Posts][GET /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка отримання поста.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { authorId, content, files } = req.body;

        if (!authorId || !isValidObjectId(authorId)) {
            return res.status(400).json({ success: false, error: 'Некоректний authorId.' });
        }
        if (!content || typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({ success: false, error: 'Текст поста не може бути порожнім.' });
        }

        const userExists = await User.exists({ _id: authorId });
        if (!userExists) {
            return res.status(404).json({ success: false, error: 'Автор не знайдений.' });
        }

        const postDoc = new Post({
            authorId,
            content: content.trim(),
            files: Array.isArray(files) ? files : [],
            likes: [],
            comments: []
        });

        await postDoc.save();

        const created = await Post.findById(postDoc._id)
            .populate('authorId', 'firstName lastName avatarUrl')
            .lean();

        return res.status(201).json({ success: true, post: created });
    } catch (err) {
        console.error('[Posts][POST /]', err);
        return res.status(500).json({ success: false, error: 'Помилка створення поста.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, error: 'Невірний ID поста.' });
        }
        const deleted = await Post.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Пост не знайдено.' });
        }
        return res.status(200).json({ success: true, message: 'Пост успішно видалено.' });
    } catch (err) {
        console.error('[Posts][DELETE /:id]', err);
        return res.status(500).json({ success: false, error: 'Помилка видалення поста.' });
    }
});

router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({ success: false, error: 'Некоректні ID.' });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Пост не знайдено.' });
        }

        const liked = post.likes.includes(userId);
        if (liked) {
            // Якщо вже є серед лайків, то видаляємо
            post.likes = post.likes.filter(uid => uid.toString() !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        return res.status(200).json({ success: true, liked: !liked, likesCount: post.likes.length });
    } catch (err) {
        console.error('[Posts][POST /:id/like]', err);
        return res.status(500).json({ success: false, error: 'Помилка оновлення лайку.' });
    }
});

router.post('/:id/comment', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, text } = req.body;

        if (!isValidObjectId(id) || !isValidObjectId(authorId)) {
            return res.status(400).json({ success: false, error: 'Некоректні ID.' });
        }
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ success: false, error: 'Текст коментаря не може бути порожнім.' });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Пост не знайдено.' });
        }

        const userExists = await User.exists({ _id: authorId });
        if (!userExists) {
            return res.status(404).json({ success: false, error: 'Автор коментаря не знайдений.' });
        }

        const newComment = {
            authorId,
            text: text.trim(),
            createdAt: new Date(),
            likes: []
        };
        post.comments.push(newComment);
        await post.save();

        const updated = await Post.findById(id)
            .populate('authorId', 'firstName lastName avatarUrl')
            .populate('comments.authorId', 'firstName lastName avatarUrl')
            .lean();

        return res.status(201).json({ success: true, post: updated });
    } catch (err) {
        console.error('[Posts][POST /:id/comment]', err);
        return res.status(500).json({ success: false, error: 'Помилка додавання коментаря.' });
    }
});

router.post('/:postId/comment/:commentId/like', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = req.body;

        if (!isValidObjectId(postId) || !isValidObjectId(commentId) || !isValidObjectId(userId)) {
            return res.status(400).json({ success: false, error: 'Некоректні ID.' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Пост не знайдено.' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, error: 'Коментар не знайдено.' });
        }

        const hasLiked = comment.likes.includes(userId);
        if (hasLiked) {
            comment.likes = comment.likes.filter(uid => uid.toString() !== userId);
        } else {
            comment.likes.push(userId);
        }

        await post.save();

        return res.status(200).json({ success: true, liked: !hasLiked, likesCount: comment.likes.length });
    } catch (err) {
        console.error('[Posts][POST /:postId/comment/:commentId/like]', err);
        return res.status(500).json({ success: false, error: 'Помилка оновлення лайку коментаря.' });
    }
});

export default router;
