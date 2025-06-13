import { Router } from 'express';
import mongoose from 'mongoose';
import Team from '../models/Team.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';


const router = Router();

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

router.get('/my', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // з токена
        const team = await Team.findOne({ 'members.userId': userId })
            .populate('members.userId', 'firstName lastName phone avatarUrl')
            .populate('joinRequests', 'firstName lastName phone avatarUrl');
        res.json({ success: true, team });
    } catch (err) {
        res.status(500).json({ error: 'Server error при отриманні вашої команди.' });
    }
});


router.get('/', async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('members.userId', 'firstName lastName phone avatarUrl')
            .populate('joinRequests', 'firstName lastName phone avatarUrl');
        return res.json({ success: true, teams });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при отриманні списку команд.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, description, city, trainingDays, type, creatorId } = req.body;
        if (!name || !city || !type || !creatorId) {
            return res.status(400).json({ error: 'Обовʼязкові поля: name, city, type, creatorId.' });
        }
        if (!isValidObjectId(creatorId)) {
            return res.status(400).json({ error: 'creatorId має бути дійсним ObjectId.' });
        }

        const creator = await User.findById(creatorId);
        if (!creator) {
            return res.status(404).json({ error: 'Користувача-creator не знайдено.' });
        }

        if (creator.teams && creator.teams.length > 0) {
            return res.status(400).json({ error: 'Ви вже є учасником команди. Покиньте поточну, щоб створити нову.' });
        }

        const newTeam = new Team({
            name,
            description: description || '',
            city,
            trainingDays: trainingDays || '',
            type,
            ownerId: creatorId,
            members: [{ userId: creatorId, roleInTeam: 'owner' }],
            joinRequests: []
        });
        await newTeam.save();

        creator.role = 'owner';
        creator.teams = [newTeam._id];
        await creator.save();

        const populated = await Team.findById(newTeam._id)
            .populate('members.userId', 'firstName lastName phone avatarUrl')
            .populate('joinRequests', 'firstName lastName phone avatarUrl');

        return res.status(201).json({ success: true, team: populated });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при створенні команди.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const team = await Team.findById(id)
            .populate('members.userId', 'firstName lastName phone avatarUrl')
            .populate('joinRequests', 'firstName lastName phone avatarUrl');
        if (!team) {
            return res.status(404).json({ error: 'Команду не знайдено.' });
        }
        return res.json({ success: true, team });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при отриманні команди.' });
    }
});

router.post('/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }

        const team = await Team.findById(id);
        const user = await User.findById(userId);
        if (!team || !user) return res.status(404).json({ error: 'Команду або користувача не знайдено.' });

        if (user.teams && user.teams.length > 0) {
            return res.status(400).json({ error: 'Ви вже є учасником команди. Не можна подати заявку до іншої.' });
        }

        if (team.members.some(m => m.userId.toString() === userId)) {
            return res.status(400).json({ error: 'Ви вже є учасником цієї команди.' });
        }

        if (team.joinRequests.includes(userId)) {
            return res.status(400).json({ error: 'Ви вже подали запит на цю команду.' });
        }

        team.joinRequests.push(userId);
        await team.save();

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при поданні запиту на приєднання.' });
    }
});

router.post('/:id/requests/:userId/approve', async (req, res) => {
    try {
        const { id, userId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }

        const team = await Team.findById(id);
        const user = await User.findById(userId);
        if (!team || !user) return res.status(404).json({ error: 'Команду або користувача не знайдено.' });

        team.joinRequests = team.joinRequests.filter(uid => uid.toString() !== userId);

        if (!team.members.some(m => m.userId.toString() === userId)) {
            team.members.push({ userId, roleInTeam: 'member' });
            user.teams = user.teams || [];
            user.teams.push(team._id);
            await user.save();
        }
        await team.save();

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при схваленні запиту.' });
    }
});

router.post('/:id/requests/:userId/reject', async (req, res) => {
    try {
        const { id, userId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ error: 'Команду не знайдено.' });

        team.joinRequests = team.joinRequests.filter(uid => uid.toString() !== userId);
        await team.save();

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при відхиленні запиту.' });
    }
});

router.post('/:id/leave', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        const team = await Team.findById(id);
        const user = await User.findById(userId);
        if (!team || !user) return res.status(404).json({ error: 'Команду або користувача не знайдено.' });

        team.members = team.members.filter(m => m.userId.toString() !== userId);

        if (team.ownerId.toString() === userId) {
            // видалити команду повністю
            await Team.deleteOne({ _id: id });
            // знімаємо роль owner
            user.role = 'player';
            user.teams = (user.teams || []).filter(tid => tid.toString() !== id);
            await user.save();
            return res.json({ success: true, deleted: true });
        }

        user.teams = (user.teams || []).filter(tid => tid.toString() !== id);
        await team.save();
        await user.save();

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при виході з команди.' });
    }
});

router.post('/:id/remove/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;
        if (!isValidObjectId(id) || !isValidObjectId(userId)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        const team = await Team.findById(id);
        const user = await User.findById(userId);
        if (!team || !user) return res.status(404).json({ error: 'Команду або користувача не знайдено.' });

        team.members = team.members.filter(m => m.userId.toString() !== userId);
        user.teams = (user.teams || []).filter(tid => tid.toString() !== id);

        if (team.ownerId.toString() === userId) {
            user.role = 'player';
        }
        await team.save();
        await user.save();

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при видаленні учасника.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ObjectId.' });
        }
        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ error: 'Команду не знайдено.' });

        for (const m of team.members) {
            const user = await User.findById(m.userId);
            if (user) {
                user.teams = (user.teams || []).filter(tid => tid.toString() !== id);
                if (m.roleInTeam === 'owner') user.role = 'player';
                await user.save();
            }
        }

        await Team.deleteOne({ _id: id });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при видаленні команди.' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, city, trainingDays, type } = req.body;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Невірний формат ID.' });
        }
        const team = await Team.findById(id);
        if (!team) return res.status(404).json({ error: 'Команду не знайдено.' });

        if (name) team.name = name;
        if (description) team.description = description;
        if (city) team.city = city;
        if (trainingDays) team.trainingDays = trainingDays;
        if (type) team.type = type;

        await team.save();

        return res.json({ success: true, team });
    } catch (err) {
        return res.status(500).json({ error: 'Server error при редагуванні команди.' });
    }
});

export default router;
