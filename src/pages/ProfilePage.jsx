import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Button,
    TextField,
    Paper,
    styled,
    IconButton,
    Tabs,
    Tab,
    useTheme,
    Stack,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const CoverContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    height: 120,
    backgroundColor: theme.palette.primary.main,
}));

export default function ProfilePage() {
    const theme = useTheme();
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [profilePosts, setProfilePosts] = useState([]);
    const [editingAbout, setEditingAbout] = useState(false);
    const [aboutValue, setAboutValue] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostFiles, setNewPostFiles] = useState([]);

    const isOwner = user?.id === id;

    useEffect(() => {
        if (!token) return;
        fetch(`/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (!data.user) return navigate('/not-found');
                setProfileData(data.user);
                setAboutValue(data.user.about || '');
            })
            .catch(() => navigate('/not-found'));
    }, [id, token, navigate]);

    useEffect(() => {
        if (!token || !profileData) return;
        fetch(`/api/users/${id}/posts`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(raw => {
                const arr = Array.isArray(raw) ? raw : [];
                const shaped = arr.map(p => ({
                    id:        p._id || p.id,
                    author:    {
                        id:     user.id,
                        name:   `${profileData.firstName} ${profileData.lastName}`,
                        avatar: profileData.avatarUrl
                    },
                    content:   p.content,
                    createdAt: new Date(p.createdAt).getTime(),
                    likes:     Array.isArray(p.likes) ? p.likes.length : (p.likes || 0),
                    likedByMe: false,
                    saved:     false,
                    files:     p.files || [],
                    comments:  p.comments || []
                }));
                setProfilePosts(shaped);
            })
            .catch(() => setProfilePosts([]));
    }, [id, token, profileData, user.id]);

    if (!profileData) {
        return <Typography sx={{ p: 3 }}>Завантажуємо профіль...</Typography>;
    }

    const handleTabChange = (_, v) => setTabValue(v);

    const handleSaveAbout = async () => {
        const trimmed = aboutValue.trim();
        await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ about: trimmed }),
        });
        setProfileData(p => ({ ...p, about: trimmed }));
        setEditingAbout(false);
    };

    const handleAvatarChange = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfileData(p => ({ ...p, avatarUrl: URL.createObjectURL(file) }));

        const fd = new FormData();
        fd.append('avatar', file);
        const res = await fetch(`/api/users/${id}/avatar`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });
        if (res.ok) {
            const { avatarUrl } = await res.json();
            setProfileData(p => ({ ...p, avatarUrl }));
        }
    };

    const handleNewFilesChange = e => {
        const files = Array.from(e.target.files);
        setNewPostFiles(files.map(f => ({
            url:  URL.createObjectURL(f),
            type: f.type.startsWith('video/') ? 'video' : 'image',
            file: f
        })));
    };

    const handlePublish = async () => {
        const content = newPostText.trim();
        if (!content && newPostFiles.length === 0) return;
        const res = await fetch(`/api/users/${id}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                content,
                files: newPostFiles.map(f => ({ url: f.url, type: f.type })),
            }),
        });
        if (!res.ok) {
            console.error('Не вдалося створити допис');
            return;
        }
        const created = await res.json();
        const newPost = {
            id:        created._id || created.id,
            author:    {
                id:     user.id,
                name:   `${profileData.firstName} ${profileData.lastName}`,
                avatar: profileData.avatarUrl
            },
            content:   created.content,
            createdAt: new Date(created.createdAt).getTime(),
            likes:     Array.isArray(created.likes) ? created.likes.length : (created.likes || 0),
            likedByMe: false,
            saved:     false,
            files:     created.files || [],
            comments:  created.comments || []
        };
        setProfilePosts(prev => [newPost, ...prev]);
        setNewPostText('');
        setNewPostFiles([]);
        setShowNewPostForm(false);
    };

    return (
        <Box sx={{ width: '100%', overflowX: 'hidden' }}>
            {/* HEADER */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', boxShadow: 1 }}>
                <CoverContainer />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, mt: -6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={profileData.avatarUrl}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    border: `4px solid ${theme.palette.background.paper}`,
                                    bgcolor: profileData.avatarUrl ? 'transparent' : theme.palette.grey[200],
                                    fontSize: '2rem'
                                }}
                            >
                                {profileData.firstName.charAt(0)}
                            </Avatar>
                            {isOwner && (
                                <>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="avatar-upload"
                                        hidden
                                        onChange={handleAvatarChange}
                                    />
                                    <label htmlFor="avatar-upload">
                                        <IconButton
                                            component="span"
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                bgcolor: theme.palette.background.paper,
                                                border: '1px solid ' + theme.palette.grey[300],
                                                '&:hover': { bgcolor: theme.palette.grey[100] }
                                            }}
                                        >
                                            <CameraAltIcon fontSize="small" />
                                        </IconButton>
                                    </label>
                                </>
                            )}
                        </Box>
                        <Typography variant="h5">
                            {profileData.firstName} {profileData.lastName}
                        </Typography>
                    </Box>
                    {isOwner && (
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ height: 36, minWidth: 165 }}
                            onClick={() => setEditingAbout(true)}
                        >
                            Редагувати профіль
                        </Button>
                    )}
                </Box>

                <Paper
                    elevation={1}
                    sx={{
                        mx: { xs: 1, md: 'auto' },
                        mt: 2,
                        p: 2,
                        width: '100%',
                        maxWidth: 1240,
                        boxSizing: 'border-box'
                    }}
                >
                    {editingAbout ? (
                        <Box component="form" onSubmit={e => e.preventDefault()}>
                            <TextField
                                label="Про мене"
                                multiline
                                fullWidth
                                minRows={3}
                                maxRows={8}
                                inputProps={{ maxLength: 1000 }}
                                helperText={`${aboutValue.length} / 1000`}
                                value={aboutValue}
                                onChange={e => setAboutValue(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button size="small" onClick={() => setEditingAbout(false)}>Скасувати</Button>
                                <Button size="small" variant="contained" onClick={handleSaveAbout}>Зберегти</Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom><strong>Про мене:</strong></Typography>
                            <Typography variant="body1" sx={{
                                wordBreak: 'break-all',
                                overflowWrap: 'anywhere',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {profileData.about}
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    mx: 3,
                    mt: 1
                }}>
                    <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
                        <Tab label="ПУБЛІКАЦІЇ" />
                    </Tabs>
                    {isOwner && (
                        <Button
                            variant="contained"
                            size="small"
                            sx={{ height: 36, minWidth: 165, ml: 'auto' }}
                            onClick={() => setShowNewPostForm(true)}
                        >
                            Створити допис
                        </Button>
                    )}
                </Box>
            </Box>

            <Box sx={{ p: 3 }}>
                {isOwner && showNewPostForm ? (
                    <Paper elevation={1} sx={{ mx: { xs: 1, md: 'auto' }, p: 2, maxWidth: 1240 }}>
                        <Typography variant="h6" gutterBottom>Новий допис</Typography>

                        <Button component="label" variant="outlined" size="small" sx={{ mb: 1 }}>
                            Прикріпити файли
                            <input
                                hidden
                                multiple
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleNewFilesChange}
                            />
                        </Button>

                        {newPostFiles.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                {newPostFiles.map((f, i) => (
                                    <Box key={i} sx={{ width: 120, height: 80 }}>
                                        {f.type === 'image'
                                            ? <Box component="img" src={f.url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <video src={f.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        }
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <TextField
                            label="Текст допису"
                            placeholder="Напишіть..."
                            fullWidth
                            multiline
                            minRows={3}
                            maxRows={8}
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value.slice(0, 3000))}
                            helperText={`${newPostText.length} / 3000`}
                            sx={{ mb: 1 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" onClick={() => setShowNewPostForm(false)}>Скасувати</Button>
                            <Button size="small" variant="contained" onClick={handlePublish}>Опублікувати</Button>
                        </Box>
                    </Paper>
                ) : (
                    <Stack spacing={2} sx={{ maxWidth: 1240, mx: 'auto' }}>
                        {profilePosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
