import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    TextField,
    Button,
    Divider,
    Paper,
    Menu,
    MenuItem,
    Dialog,
    DialogContent,
    DialogActions,
    IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Send as SendIcon,
    InsertDriveFile as InsertDriveFileIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Photo as PhotoIcon,
    AttachFile as AttachFileIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';

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

export default function ChatPage() {
    const { user, phone, name: myName } = useAuth();
    const myId = user?.id;
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const endRef = useRef(null);

    const [friends, setFriends] = useState([]);
    const chatUsers = friends;

    useEffect(() => {
        if (!myId) return;
        axios.get(`/api/users/${myId}/friends`)
            .then(({ data }) => setFriends(data.friends || []))
            .catch(() => setFriends([]));
    }, [myId]);

    const [allMessages, setAllMessages] = useState(() => {
        const saved = localStorage.getItem('chat_allMessages');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
            }
        }
        return {};
    });

    useEffect(() => {
        localStorage.setItem('chat_allMessages', JSON.stringify(allMessages));
    }, [allMessages]);

    const [selectedChatUser, setSelectedChatUser] = useState(null);

    const roomId = myId && selectedChatUser
        ? [myId, selectedChatUser.id].sort().join('_')
        : null;

    useEffect(() => {
        if (paramId && friends.length > 0) {
            const found = friends.find((u) => u.id === paramId);
            if (found) {
                setSelectedChatUser(found);
            } else {
                setSelectedChatUser(null);
                navigate('/chat', { replace: true });
            }
        } else {
            setSelectedChatUser(null);
        }
    }, [paramId, friends, navigate]);

    useEffect(() => {
        if (!roomId) return;
        socket.emit('joinRoom', roomId);
        socket.off('message');
        socket.on('message', (msg) => {
            setAllMessages((prev) => {
                const roomMsgs = prev[msg.room] || [];
                if (
                    roomMsgs.some(
                        (m) =>
                            m.author === msg.author &&
                            m.text === msg.text &&
                            m.file === msg.file &&
                            m.timestamp === msg.timestamp
                    )
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    [msg.room]: [
                        ...roomMsgs,
                        {
                            id: `${msg.room}-msg-${roomMsgs.length + 1}`,
                            author: msg.author,
                            text: msg.text || null,
                            file: msg.file || null,
                            fileType: msg.fileType || null,
                            timestamp: msg.timestamp,
                            edited: false,
                        },
                    ],
                };
            });
        });

        return () => {
            socket.off('message');
        };
    }, [roomId, allMessages]);

    useEffect(() => {
        if (!selectedChatUser) return;
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allMessages, selectedChatUser]);

    const [input, setInput] = useState('');
    const [fileToSend, setFileToSend] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);
    const [menuMsgId, setMenuMsgId] = useState(null);
    const [editing, setEditing] = useState({
        msgId: null,
        draftText: '',
    });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogFile, setDialogFile] = useState(null);

    const sendMessage = () => {
        if ((!input.trim() && !fileToSend) || !selectedChatUser) return;
        if (!roomId) return;

        const newMsgObj = {
            room: roomId,
            author: myName || phone,
            text: input.trim() || null,
            file: null,
            fileType: null,
            timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
        };

        if (fileToSend) {
            const url = URL.createObjectURL(fileToSend);
            newMsgObj.file = url;
            if (fileToSend.type.startsWith('image/')) {
                newMsgObj.fileType = 'image';
            } else if (fileToSend.type.startsWith('video/')) {
                newMsgObj.fileType = 'video';
            } else {
                newMsgObj.fileType = 'other';
            }
        }

        socket.emit('message', newMsgObj);

        setAllMessages((prev) => {
            const roomMsgs = prev[roomId] || [];
            return {
                ...prev,
                [roomId]: [
                    ...roomMsgs,
                    {
                        id: `${roomId}-msg-${roomMsgs.length + 1}`,
                        author: newMsgObj.author,
                        text: newMsgObj.text,
                        file: newMsgObj.file,
                        fileType: newMsgObj.fileType,
                        timestamp: newMsgObj.timestamp,
                        edited: false,
                    },
                ],
            };
        });

        setInput('');
        setFileToSend(null);
    };

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileToSend(file);
            document.getElementById('media-input').value = '';
        }
    };

    const handleGenericFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileToSend(file);
            document.getElementById('file-input').value = '';
        }
    };

    const clearAttachedFile = () => {
        setFileToSend(null);
        document.getElementById('media-input').value = '';
        document.getElementById('file-input').value = '';
    };

    const handleContextMenu = (event, msg) => {
        event.preventDefault();
        setMenuPosition({ top: event.clientY, left: event.clientX });
        setMenuMsgId(msg.id);
    };
    const handleCloseMenu = () => {
        setMenuPosition(null);
        setMenuMsgId(null);
    };

    const startEditing = (msgId) => {
        if (!roomId) return;
        const msgs = allMessages[roomId] || [];
        const target = msgs.find((m) => m.id === msgId);
        if (!target) return;
        setEditing({
            msgId,
            draftText: target.text || '',
        });
        handleCloseMenu();
    };
    const saveEditedMessage = () => {
        if (!roomId) return;
        setAllMessages((prev) => {
            const updated = prev[roomId].map((m) => {
                if (m.id === editing.msgId) {
                    return {
                        ...m,
                        text: editing.draftText,
                        edited: true,
                    };
                }
                return m;
            });
            return {
                ...prev,
                [roomId]: updated,
            };
        });
        setEditing({ msgId: null, draftText: '' });
    };
    const cancelEditing = () => {
        setEditing({ msgId: null, draftText: '' });
    };
    const deleteMessage = (msgId) => {
        if (!roomId) return;
        setAllMessages((prev) => {
            const filtered = prev[roomId].filter((m) => m.id !== msgId);
            return {
                ...prev,
                [roomId]: filtered,
            };
        });
        handleCloseMenu();
    };

    const openMediaDialog = (fileUrl, fileName, fileType) => {
        setDialogFile({ url: fileUrl, name: fileName, type: fileType });
        setDialogOpen(true);
    };
    const closeMediaDialog = () => {
        setDialogOpen(false);
        setDialogFile(null);
    };

    const handleSelectUser = (user) => {
        navigate(`/chat/${user.id}`);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexGrow: 1,
                width: '100%',
                height: '100%',
                alignSelf: 'stretch',
                minHeight: 0,
            }}
        >

            <Box
                sx={{
                    width: 260,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    borderRadius: 1,
                    overflowY: 'auto',
                    mr: 2,
                    pt: 2,
                    height: '100%',
                    minHeight: 0,
                    boxSizing: 'border-box',
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        bgcolor: 'primary.dark',
                        p: 1,
                        textAlign: 'center',
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                    }}
                >
                    Чати
                </Typography>

                <List disablePadding>
                    {chatUsers.map((user) => {
                        const isSelected = selectedChatUser?.id === user.id;
                        return (
                            <ListItem
                                key={user.id}
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? 'primary.dark' : 'inherit',
                                    '&:hover': { bgcolor: 'primary.light' },
                                    color: '#fff',
                                    py: 1.2,
                                    pl: 2,
                                }}
                                onClick={() => handleSelectUser(user)}
                            >
                                <ListItemAvatar>
                                    <Avatar src={user.avatarUrl}>
                                        {!user.avatarUrl && user.firstName.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`${user.firstName} ${user.lastName}`} />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    minHeight: 0,
                    boxSizing: 'border-box',
                }}
            >
                {!selectedChatUser ? (
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2,
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Оберіть чат ліворуч, щоб почати спілкування
                        </Typography>
                    </Box>
                ) : (
                    <>

                        <Box
                            sx={{
                                bgcolor: 'primary.main',
                                color: '#fff',
                                p: 2,
                                borderBottom: '1px solid #ccc',
                                display: 'flex',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                                height: 64,
                            }}
                        >
                            <Avatar sx={{ mr: 1 }} src={selectedChatUser.avatarUrl}>
                                {!selectedChatUser.avatarUrl && selectedChatUser.firstName.charAt(0)}
                            </Avatar>
                            <Typography
                                variant="h6"
                                component={RouterLink}
                                to={`/profile/${selectedChatUser.id}`}
                                sx={{
                                    textDecoration: 'none',
                                    color: '#fff',
                                }}
                            >
                                {selectedChatUser.firstName} {selectedChatUser.lastName}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                flexGrow: 1,
                                p: 2,
                                overflowY: 'auto',
                                bgcolor: 'background.paper',
                                boxSizing: 'border-box',
                                minHeight: 0,
                            }}
                        >
                            <List disablePadding>
                                {(allMessages[roomId] || []).map((m) => {
                                    const isSelf = m.author === (myName || phone);
                                    return (
                                        <MessageRow
                                            key={m.id}
                                            self={isSelf ? 1 : 0}
                                            onContextMenu={(e) => handleContextMenu(e, m)}
                                        >
                                            <MessageBubble self={isSelf ? 1 : 0}>
                                                {editing.msgId === m.id ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <TextField
                                                            variant="outlined"
                                                            fullWidth
                                                            multiline
                                                            minRows={1}
                                                            maxRows={4}
                                                            value={editing.draftText}
                                                            onChange={(e) =>
                                                                setEditing((prev) => ({
                                                                    ...prev,
                                                                    draftText: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                gap: 1,
                                                                justifyContent: 'flex-end',
                                                            }}
                                                        >
                                                            <Button size="small" onClick={cancelEditing}>
                                                                Скасувати
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={saveEditedMessage}
                                                            >
                                                                Зберегти
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <>

                                                        {m.file && m.fileType === 'image' && (
                                                            <Box sx={{ mb: 1 }}>
                                                                <img
                                                                    src={m.file}
                                                                    alt={m.id}
                                                                    style={{
                                                                        maxWidth: '100%',
                                                                        maxHeight: '25vh',
                                                                        borderRadius: 4,
                                                                        cursor: 'pointer',
                                                                        objectFit: 'contain',
                                                                    }}
                                                                    onClick={() =>
                                                                        openMediaDialog(m.file, `image-${m.id}`, 'image')
                                                                    }
                                                                />
                                                            </Box>
                                                        )}

                                                        {m.file && m.fileType === 'video' && (
                                                            <Box sx={{ mb: 1 }}>
                                                                <video
                                                                    controls
                                                                    src={m.file}
                                                                    style={{
                                                                        maxWidth: '100%',
                                                                        maxHeight: '25vh',
                                                                        borderRadius: 4,
                                                                        objectFit: 'contain',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                    onClick={() =>
                                                                        openMediaDialog(m.file, `video-${m.id}`, 'video')
                                                                    }
                                                                />
                                                            </Box>
                                                        )}

                                                        {m.file && m.fileType === 'other' && (
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    backgroundColor: '#fff',
                                                                    p: 1,
                                                                    borderRadius: 1,
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => openMediaDialog(m.file, m.file, 'other')}
                                                            >
                                                                <InsertDriveFileIcon sx={{ mr: 1 }} />
                                                                <Typography
                                                                    variant="body2"
                                                                    noWrap
                                                                    sx={{ textDecoration: 'underline' }}
                                                                >
                                                                    {m.file}
                                                                </Typography>
                                                            </Box>
                                                        )}


                                                        {m.text && (
                                                            <Typography
                                                                variant="body1"
                                                                sx={{ whiteSpace: 'pre-wrap' }}
                                                            >
                                                                {m.text}
                                                            </Typography>
                                                        )}


                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent: isSelf ? 'flex-end' : 'flex-start',
                                                                mt: 0.5,
                                                                fontSize: '0.75rem',
                                                                color: 'text.secondary',
                                                            }}
                                                        >
                                                            <Typography variant="caption">
                                                                {m.timestamp}
                                                                {m.edited ? ' (редаговано)' : ''}
                                                            </Typography>
                                                        </Box>
                                                    </>
                                                )}
                                            </MessageBubble>
                                        </MessageRow>
                                    );
                                })}
                                <div ref={endRef} />
                            </List>


                            <Menu
                                open={Boolean(menuPosition)}
                                onClose={handleCloseMenu}
                                anchorReference="anchorPosition"
                                anchorPosition={
                                    menuPosition
                                        ? { top: menuPosition.top, left: menuPosition.left }
                                        : undefined
                                }
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            >
                                <MenuItem onClick={() => startEditing(menuMsgId)}>
                                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Редагувати
                                </MenuItem>
                                <MenuItem onClick={() => deleteMessage(menuMsgId)}>
                                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Видалити
                                </MenuItem>
                            </Menu>
                        </Box>

                        <Divider />
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 2,
                                boxSizing: 'border-box',
                                backgroundColor: 'background.paper',
                                gap: 1,
                            }}
                        >
                            <input
                                accept="image/*,video/*"
                                style={{ display: 'none' }}
                                id="media-input"
                                type="file"
                                onChange={handleMediaChange}
                            />
                            <label htmlFor="media-input">
                                <IconButton
                                    color="primary"
                                    component="span"
                                    disabled={input.trim() !== ''}
                                >
                                    <PhotoIcon />
                                </IconButton>
                            </label>


                            <input
                                accept="*"
                                style={{ display: 'none' }}
                                id="file-input"
                                type="file"
                                onChange={handleGenericFileChange}
                            />
                            <label htmlFor="file-input">
                                <IconButton
                                    color="primary"
                                    component="span"
                                    disabled={input.trim() !== ''}
                                >
                                    <AttachFileIcon />
                                </IconButton>
                            </label>

                            {fileToSend && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: '#f5f5f5',
                                        p: 0.5,
                                        borderRadius: 1,
                                        maxWidth: 200,
                                    }}
                                >
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
                                    <IconButton
                                        size="small"
                                        onClick={clearAttachedFile}
                                        sx={{ ml: 0.5 }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}

                            <TextField
                                placeholder="Введіть повідомлення..."
                                variant="outlined"
                                fullWidth
                                multiline
                                maxRows={4}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                sx={{ ml: 1, height: '56px' }}
                                endIcon={<SendIcon />}
                                onClick={sendMessage}
                            >
                                Надіслати
                            </Button>
                        </Box>
                    </>
                )}
            </Box>


            <Dialog
                open={dialogOpen}
                onClose={closeMediaDialog}
                fullScreen={false}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'primary.light',
                        backgroundColor: 'white',
                        p: 0,
                        overflow: 'hidden',
                        boxShadow: 24,
                    },
                }}
                sx={{
                    '& .MuiDialog-container': {
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                }}
            >
                <DialogContent
                    sx={{
                        p: 0,
                        backgroundColor: 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        maxHeight: '80vh',
                    }}
                >
                    {dialogFile?.type === 'image' && (
                        <img
                            src={dialogFile.url}
                            alt={dialogFile.name}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    {dialogFile?.type === 'video' && (
                        <video
                            controls
                            src={dialogFile.url}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    {dialogFile?.type === 'other' && (
                        <Box
                            sx={{
                                p: 2,
                                textAlign: 'center',
                            }}
                        >
                            <InsertDriveFileIcon sx={{ fontSize: 60, mb: 1 }} />
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Немає попереднього перегляду
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {dialogFile.name}
                            </Typography>
                            <Button
                                variant="contained"
                                component="a"
                                href={dialogFile.url}
                                download={dialogFile.name}
                            >
                                Завантажити файл
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions
                    sx={{
                        backgroundColor: 'white',
                        p: 1,
                        justifyContent: 'flex-end',
                    }}
                >
                    <Button onClick={closeMediaDialog} color="primary">
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
