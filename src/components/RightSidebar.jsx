import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    Avatar,
    TextField,
    Typography,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RightSidebar() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showAIChat, setShowAIChat] = useState(false);

    const [aiMessages, setAiMessages] = useState([
        {
            author: 'AI',
            text: 'Привіт! Я твій AI-асистент. Чим можу допомогти?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages]);

    const sendToAI = async () => {
        if (!input.trim()) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userText = input.trim();

        setAiMessages((prev) => [
            ...prev,
            { author: 'You', text: userText, timestamp: now },
            { author: 'AI', text: '...', timestamp: now, pending: true },
        ]);
        setInput('');

        try {
            const history = [
                { role: "system", content: "Ти дружній AI-асистент для футбольної спільноти." },
                ...aiMessages
                    .filter(m => !m.pending)
                    .map(m =>
                        m.author === 'You'
                            ? { role: 'user', content: m.text }
                            : { role: 'assistant', content: m.text }
                    ),
                { role: "user", content: userText }
            ];

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history }),
            });

            const data = await response.json();
            let aiReply = data.reply || 'Вибач, я не зміг відповісти.';

            setAiMessages((prev) => [
                ...prev.slice(0, -1), // видалити "pending"
                { author: 'AI', text: aiReply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ]);
        } catch (err) {
            setAiMessages((prev) => [
                ...prev.slice(0, -1),
                { author: 'AI', text: 'Вибач, сталася помилка :(', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            ]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendToAI();
        }
    };

    const avatarLetter = user?.firstName ? user.firstName[0].toUpperCase() : '?';

    return (
        <Box
            sx={{
                width: 330,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                minHeight: '100vh',
                borderLeft: '1px solid rgba(255,255,255,0.6)',
            }}
        >
            <Box
                sx={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    px: 2,
                    boxSizing: 'border-box',
                }}
            >
                <Avatar
                    src={user?.avatarUrl || undefined}
                    onClick={() => user?.id && navigate(`/profile/${user.id}`)}
                    sx={{
                        bgcolor: 'secondary.main',
                        color: '#fff',
                        mr: 2,
                        cursor: 'pointer',
                        width: 32,
                        height: 32,
                    }}
                >
                    {(!user?.avatarUrl && avatarLetter) || null}
                </Avatar>
            </Box>

            <Divider sx={{ bgcolor: '#fff' }} />

            <List component="nav" sx={{ flexGrow: 0, p: 0 }}>
                <ListItemButton
                    onClick={() => setShowAIChat((prev) => !prev)}
                    selected={showAIChat}
                    sx={{
                        color: '#fff',
                        '&.Mui-selected': { bgcolor: 'primary.dark' },
                        px: 2,
                        height: '48px',
                    }}
                >
                    <ListItemIcon sx={{ color: '#fff', minWidth: '32px' }}>
                        <ChatIcon />
                    </ListItemIcon>
                    <ListItemText primary="AI Асистент" />
                </ListItemButton>
            </List>

            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ bgcolor: '#fff' }} />
            <Box sx={{ height: '64px' }} />

            {showAIChat && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '64px',
                        right: 0,
                        width: 330,
                        height: 'calc(100vh - 64px)',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'background.paper',
                        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
                        zIndex: 10,
                    }}
                >
                    <Box
                        sx={{
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            borderBottom: '1px solid rgba(0,0,0,0.12)',
                        }}
                    >
                        <Typography variant="subtitle1">AI Асистент</Typography>
                        <IconButton size="small" onClick={() => setShowAIChat(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            flexGrow: 1,
                            p: 2,
                            overflowY: 'auto',
                            bgcolor: 'grey.50',
                        }}
                    >
                        {aiMessages.map((m, i) => (
                            <Box
                                key={i}
                                sx={{
                                    mb: 1,
                                    display: 'flex',
                                    flexDirection: m.author === 'You' ? 'row-reverse' : 'row',
                                }}
                            >
                                <Box
                                    sx={{
                                        maxWidth: '75%',
                                        bgcolor: m.author === 'You' ? 'primary.main' : 'grey.300',
                                        color: m.author === 'You' ? '#fff' : '#000',
                                        borderRadius: 2,
                                        px: 1.5,
                                        py: 0.75,
                                    }}
                                >
                                    <Typography variant="body2">{m.text}</Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            textAlign: m.author === 'You' ? 'left' : 'right',
                                            mt: 0.5,
                                            color:
                                                m.author === 'You'
                                                    ? 'rgba(255,255,255,0.7)'
                                                    : 'rgba(0,0,0,0.6)',
                                        }}
                                    >
                                        {m.timestamp}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        <div ref={chatEndRef} />
                    </Box>


                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderTop: '1px solid rgba(0,0,0,0.12)',
                            bgcolor: 'grey.100',
                        }}
                    >
                        <TextField
                            placeholder="Написати повідомлення…"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <IconButton color="primary" sx={{ ml: 1 }} onClick={sendToAI}>
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
