import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRouter from './routes/ai.js';
import teamChatRouter from './routes/teamChat.js';

import authRouter from './routes/auth.js';
import testDbRouter from './routes/testDb.js';
import usersRouter from './routes/users.js';
import teamsRouter from './routes/teams.js';
import postsRouter from './routes/posts.js';
import bookingsRouter from './routes/bookings.js';
import fieldsRouter from './routes/fields.js';
import chatRouter from './routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('⚠️  Помилка: змінна MONGODB_URI не знайдена');
    process.exit(1);
}

mongoose
    .connect(mongoUri)
    .then(() => console.log('✅ MongoDB: підключено успішно.'))
    .catch(err => {
        console.error('❌ MongoDB: помилка підключення:', err);
        process.exit(1);
    });

mongoose.connection.on('connected', () =>
    console.log('🔗 MongoDB readyState =', mongoose.connection.readyState)
);

mongoose.connection.on('error', err =>
    console.error('❌ MongoDB connection error:', err)
);

app.use('/api/auth', authRouter);

app.use('/api/test-db', testDbRouter);

app.use('/api/users', usersRouter);

app.use(
    '/static/avatars',
    express.static(path.join(__dirname, 'uploads', 'avatars'))
);

app.use('/api/teams', teamsRouter);

app.use('/api/posts', postsRouter);

app.use('/api/bookings', bookingsRouter);

app.use('/api/fields', fieldsRouter);

app.use('/api/chat', chatRouter);

app.use('/api/team-chat', teamChatRouter);
app.use(
    '/static/team-chat',
    express.static(path.join(__dirname, 'uploads', 'team-chat'))
);


app.use('/api/ai', aiRouter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
    console.log('New client connected, socket id:', socket.id);

    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('message', (msg) => {
        // msg має вигляд: { room: 'roomId', author: 'userId', text: '...' }
        io.to(msg.room).emit('message', msg);
        console.log(`Message from ${msg.author} to room ${msg.room}: ${msg.text}`);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
