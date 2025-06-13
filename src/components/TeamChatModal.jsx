import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, Button, List, Paper, IconButton, CircularProgress
} from '@mui/material';
import { Send as SendIcon, InsertDriveFile as InsertDriveFileIcon, Photo as PhotoIcon, AttachFile as AttachFileIcon, Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';

const MessageRow = styled(Box)(({ theme, self }) => ({
    display: 'flex',
    justifyContent: self ? 'flex-end' : 'flex-start',
    marginBottom: theme.spacing(1),
}));
const MessageBubble = styled(Paper)(({ theme, self }) => ({
    position: 'relative',
    maxWidth: '70%',
    padding: theme.spacing(1, 1.5),
    backgroundColor: self
        ? theme.palette.success.light
        : theme.palette.grey[200],
    color: self ? theme.palette.common.white : theme.palette.text.primary,
    borderRadius: theme.spacing(1.5),
    borderTopRightRadius: self ? 0 : theme.spacing(1.5),
    borderTopLeftRadius: self ? theme.spacing(1.5) : 0,
}));

export default function TeamChatModal({ open, onClose, teamId, teamName, members, currentUser }) {
    const { token } = useAuth();
    const endRef = useRef(null);
    const roomId = `team_${teamId}`;

    // Для lightbox фото/відео
    const [mediaDialog, setMediaDialog] = useState({ open: false, url: '', type: '' });

    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');
    const [fileToSend, setFileToSend] = useState(null);
    const [fileUploading, setFileUploading] = useState(false);

    useEffect(() => {
        if (!open || !teamId) return;
        setLoading(true);
        fetch(`/api/team-chat/${teamId}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setAllMessages(data.messages || []);
            })
            .catch(() => setAllMessages([]))
            .finally(() => setLoading(false));
    }, [open, teamId, token]);

    useEffect(() => {
        if (!open || !teamId) return;
        socket.emit('joinRoom', roomId);

        const handleMessage = (msg) => {
            if (msg.room !== roomId) return;
            setAllMessages(prev => [...prev, msg]);
        };
        socket.on('message', handleMessage);

        return () => {
            socket.off('message', handleMessage);
        };
    }, [roomId, open]);

    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages, open]);

    const sendMessage = async () => {
        if ((!input.trim() && !fileToSend) || fileUploading) return;
        let fileUrl = null, fileType = null;

        // Якщо є файл — спершу завантажити файл на сервер
        if (fileToSend) {
            setFileUploading(true);
            const fd = new FormData();
            fd.append('file', fileToSend);
            const res = await fetch('/api/team-chat/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!data.success) {
                setFileUploading(false);
                alert('Не вдалося завантажити файл');
                return;
            }
            fileUrl = data.url;
            if (fileToSend.type.startsWith('image/')) fileType = 'image';
            else if (fileToSend.type.startsWith('video/')) fileType = 'video';
            else fileType = 'other';
            setFileUploading(false);
        }

        const msgObj = {
            text: input.trim() || null,
            fileUrl,
            fileType
        };
        const resp = await fetch(`/api/team-chat/${teamId}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(msgObj)
        });
        const data = await resp.json();
        if (data.success && data.message) {
            // emit через сокет, але не додаємо вручну у allMessages!
            socket.emit('message', {
                ...data.message,
                room: roomId
            });
        }
        setInput('');
        setFileToSend(null);
    };

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) setFileToSend(file);
    };
    const handleGenericFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setFileToSend(file);
    };
    const clearAttachedFile = () => setFileToSend(null);

    const openMediaDialog = (url, type) => setMediaDialog({ open: true, url, type });
    const closeMediaDialog = () => setMediaDialog({ open: false, url: '', type: '' });

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { minHeight: 540, background: '#f5f5f5' } }}>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff' }}>
                    {teamName ? `Чат команди: ${teamName}` : 'Чат команди'}
                </DialogTitle>
                <DialogContent sx={{ p: 2, bgcolor: 'grey.100', minHeight: 400 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <List disablePadding>
                            {allMessages.map((m, i) => {
                                const isSelf = m.userId === currentUser?.id;
                                return (
                                    <MessageRow key={m._id || i} self={isSelf ? 1 : 0}>
                                        <MessageBubble self={isSelf ? 1 : 0}>
                                            <Typography
                                                variant="subtitle2"
                                                sx={{ mb: 0.5, fontWeight: 500 }}
                                            >
                                                {m.author}
                                            </Typography>
                                            {m.fileUrl && m.fileType === 'image' && (
                                                <Box sx={{ mb: 1, cursor: 'pointer', textAlign: isSelf ? 'right' : 'left' }}
                                                     onClick={() => openMediaDialog(m.fileUrl, 'image')}>
                                                    <img src={m.fileUrl} alt="img"
                                                         style={{
                                                             maxWidth: 200,
                                                             maxHeight: 120,
                                                             borderRadius: 3,
                                                             border: '1px solid #eee'
                                                         }} />
                                                </Box>
                                            )}
                                            {m.fileUrl && m.fileType === 'video' && (
                                                <Box sx={{ mb: 1, cursor: 'pointer', textAlign: isSelf ? 'right' : 'left' }}
                                                     onClick={() => openMediaDialog(m.fileUrl, 'video')}>
                                                    <video src={m.fileUrl} controls
                                                           style={{
                                                               maxWidth: 200,
                                                               maxHeight: 120,
                                                               borderRadius: 3,
                                                               border: '1px solid #eee'
                                                           }} />
                                                </Box>
                                            )}
                                            {m.fileUrl && m.fileType === 'other' && (
                                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', background: '#f7f7f7', borderRadius: 1, p: 1 }}>
                                                    <InsertDriveFileIcon sx={{ mr: 1 }} />
                                                    <a href={m.fileUrl} download style={{ color: 'inherit', textDecoration: 'underline' }}>
                                                        Завантажити файл
                                                    </a>
                                                </Box>
                                            )}
                                            {m.text && (
                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {m.text}
                                                </Typography>
                                            )}
                                            <Box sx={{ mt: 0.5, fontSize: '0.75rem', color: 'text.secondary', textAlign: 'right' }}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Box>
                                        </MessageBubble>
                                    </MessageRow>
                                );
                            })}
                            <div ref={endRef} />
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2 }}>
                    <input accept="image/*,video/*" style={{ display: 'none' }} id="media-input" type="file" onChange={handleMediaChange} />
                    <label htmlFor="media-input">
                        <IconButton color="primary" component="span" disabled={input.trim() !== ''}><PhotoIcon /></IconButton>
                    </label>
                    <input accept="*" style={{ display: 'none' }} id="file-input" type="file" onChange={handleGenericFileChange} />
                    <label htmlFor="file-input">
                        <IconButton color="primary" component="span" disabled={input.trim() !== ''}><AttachFileIcon /></IconButton>
                    </label>
                    {fileToSend && (
                        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f5', p: 0.5, borderRadius: 1, maxWidth: 180 }}>
                            <InsertDriveFileIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography
                                variant="body2"
                                sx={{
                                    fontStyle: 'italic',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flexGrow: 1,
                                }}
                            >
                                {fileToSend.name}
                            </Typography>
                            <IconButton size="small" onClick={clearAttachedFile} sx={{ ml: 0.5 }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                    <TextField
                        placeholder="Введіть повідомлення…"
                        variant="outlined"
                        fullWidth
                        multiline
                        maxRows={4}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        disabled={fileUploading}
                    />
                    <Button variant="contained" endIcon={<SendIcon />} onClick={sendMessage} disabled={fileUploading}>
                        {fileUploading ? <CircularProgress size={18} /> : 'НАДІСЛАТИ'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Lightbox для фото/відео */}
            <Dialog open={mediaDialog.open} onClose={closeMediaDialog} maxWidth="md">
                <DialogContent sx={{ background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0 }}>
                    {mediaDialog.type === 'image' && (
                        <img src={mediaDialog.url} alt="img"
                             style={{ maxWidth: '90vw', maxHeight: '75vh', display: 'block', margin: '0 auto' }} />
                    )}
                    {mediaDialog.type === 'video' && (
                        <video src={mediaDialog.url} controls
                               style={{ maxWidth: '90vw', maxHeight: '75vh', display: 'block', margin: '0 auto' }} />
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={closeMediaDialog}>
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
