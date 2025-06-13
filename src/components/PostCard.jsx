import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    Divider,
    Button
} from '@mui/material';
import {
    FavoriteBorder as FavoriteBorderIcon,
    Favorite as FavoriteIcon,
    ChatBubbleOutline as ChatBubbleIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getRelativeTime(ts) {
    let timestamp;
    if (typeof ts === 'number') {
        timestamp = ts;
    } else if (typeof ts === 'string') {
        timestamp = new Date(ts).getTime();
    } else {
        return 'щойно';
    }
    if (isNaN(timestamp)) return 'щойно';
    const now = Date.now(), d = now - timestamp, s = Math.floor(d/1000);
    if (s < 60) return `${s} с тому`;
    const m = Math.floor(s / 60); if (m < 60) return `${m} хв тому`;
    const h = Math.floor(m / 60); if (h < 24) return `${h} г тому`;
    const D = Math.floor(h / 24); if (D < 7) return `${D} д тому`;
    const W = Math.floor(D / 7); if (W < 4) return `${W} тиж тому`;
    const M = Math.floor(D / 30); if (M < 12) return `${M} міс тому`;
    return `${Math.floor(D / 365)} р тому`;
}

// Коментар
function CommentItem({ comment, postId, currentUserId, onToggleLikeComment, onDeleteComment }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
                src={comment.avatarUrl}
                sx={{ width: 32, height: 32, bgcolor: 'grey.300', mr: 1 }}
            >
                {!comment.avatarUrl && (comment.authorName?.charAt(0) || "?")}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
                <Typography component="span" sx={{ fontWeight: 600, mr: 1, display: 'inline' }}>
                    <RouterLink
                        to={`/profile/${comment.authorId}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        {comment.authorName}
                    </RouterLink>
                </Typography>
                <Typography variant="caption" component="span" color="text.secondary">
                    • {getRelativeTime(comment.createdAt)}
                </Typography>
                <Typography variant="body2" sx={{
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    mt: 0.5,
                }}>
                    {comment.text}
                </Typography>
            </Box>
            <IconButton size="small" onClick={() => onToggleLikeComment(comment.id)}>
                {comment.likedByMe ? <FavoriteIcon fontSize="small" color="error" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
            <Typography variant="caption" sx={{ mr: 1 }}>{comment.likes}</Typography>
            {comment.authorId === currentUserId && (
                <IconButton size="small" onClick={() => onDeleteComment(comment.id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}
        </Box>
    );
}

export default function PostCard({ post }) {
    const { token, user } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [editDialog, setEditDialog] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [localPost, setLocalPost] = useState(formatPost(post, user));


    const files = Array.isArray(localPost.files) ? localPost.files : [];
    const comments = Array.isArray(localPost.comments) ? localPost.comments : [];


    const getPostTime = () => {
        if (typeof localPost.createdAt === 'number') return localPost.createdAt;
        if (typeof localPost.createdAt === 'string') return new Date(localPost.createdAt).getTime();
        if (typeof localPost.date === 'number') return localPost.date;
        if (typeof localPost.date === 'string') return new Date(localPost.date).getTime();
        return Date.now();
    };

    const openMenu = e => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
    const closeMenu = () => setAnchorEl(null);

    const toggleLike = async () => {
        const res = await fetch(`/api/posts/${localPost.id}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user.id })
        });
        const data = await res.json();
        setLocalPost(p => ({
            ...p,
            likedByMe: data.liked,
            likes: data.likesCount
        }));
    };

    const openPost = e => { e.stopPropagation(); setOpenDialog(true); };
    const closePost = () => { setOpenDialog(false); setCommentText(''); };

    const addComment = async () => {
        if (!commentText.trim()) return;
        const res = await fetch(`/api/posts/${localPost.id}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                authorId: user.id,
                text: commentText.trim()
            })
        });
        const data = await res.json();
        if (data.success && data.post) setLocalPost(formatPost(data.post, user));
        setCommentText('');
    };

    const toggleLikeComment = async cid => {
        const res = await fetch(`/api/posts/${localPost.id}/comment/${cid}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId: user.id })
        });
        const data = await res.json();
        if (data.success) {
            setLocalPost(p => ({
                ...p,
                comments: p.comments.map(c =>
                    c.id === cid
                        ? { ...c, likedByMe: data.liked, likes: data.likesCount }
                        : c
                )
            }));
        }
    };

    const deleteComment = async cid => {
        await fetch(`/api/posts/${localPost.id}/comment/${cid}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        setLocalPost(p => ({
            ...p,
            comments: p.comments.filter(c => c.id !== cid)
        }));
    };

    const deletePost = async () => {
        await fetch(`/api/posts/${localPost.id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
        });
        setLocalPost(null);
    };

    const openEdit = () => {
        setEditContent(localPost.content);
        setEditDialog(true);
        closeMenu();
    };
    const saveEdit = async () => {
        const res = await fetch(`/api/users/${user.id}/posts/${localPost.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ content: editContent })
        });
        if (res.ok) {
            setLocalPost(p => ({ ...p, content: editContent }));
            setEditDialog(false);
        }
    };

    if (!localPost) return null;

    function formatPost(apiPost, user) {
        return {
            id: apiPost._id || apiPost.id,
            author: {
                id: apiPost.authorId?._id || apiPost.authorId?.id || apiPost.authorId,
                name: apiPost.authorId?.firstName
                    ? `${apiPost.authorId.firstName} ${apiPost.authorId.lastName}`
                    : (apiPost.author?.name || ""),
                avatar: apiPost.authorId?.avatarUrl || apiPost.author?.avatar || "",
            },
            date: apiPost.createdAt,
            content: apiPost.content,
            files: Array.isArray(apiPost.files) ? apiPost.files : [],
            likes: Array.isArray(apiPost.likes) ? apiPost.likes.length : (apiPost.likes || 0),
            likedByMe: Array.isArray(apiPost.likes)
                ? apiPost.likes.some(id => id?.toString() === user.id)
                : false,
            saved: false,
            comments: Array.isArray(apiPost.comments) ? apiPost.comments.map(c => ({
                id: c._id || c.id,
                authorId: c.authorId?._id || c.authorId?.id || c.authorId,
                authorName: c.authorId?.firstName
                    ? `${c.authorId.firstName} ${c.authorId.lastName}`
                    : (c.authorName || ""),
                avatarUrl: c.authorId?.avatarUrl || "",
                text: c.text,
                createdAt: c.createdAt,
                likes: Array.isArray(c.likes) ? c.likes.length : (c.likes || 0),
                likedByMe: Array.isArray(c.likes)
                    ? c.likes.some(id => id?.toString() === user.id)
                    : false,
            })) : []
        };
    }

    return (
        <>
            <Paper elevation={1}
                   sx={{
                       p: 2,
                       mb: 2,
                       position: 'relative',
                       cursor: 'pointer',
                       '&:hover': { bgcolor: 'grey.50' }
                   }}
                   onClick={openPost}
            >
                <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }} onClick={openMenu}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeMenu}>
                    <MenuItem onClick={e => { e.stopPropagation(); openEdit(); }}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} />Редагувати
                    </MenuItem>
                    <MenuItem onClick={e => { e.stopPropagation(); deletePost(); }}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />Видалити
                    </MenuItem>
                </Menu>

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar src={localPost.author.avatar} sx={{ mr: 1 }}>
                        {localPost.author.avatar ? '' : localPost.author.name.charAt(0)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, mr: 1 }}>
                        <RouterLink to={`/profile/${localPost.author.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {localPost.author.name}
                        </RouterLink>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        • {getRelativeTime(getPostTime())}
                    </Typography>
                </Box>

                {files.map((f, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                        {f.type === 'image'
                            ? <Box component="img" src={f.url} sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 1 }} />
                            : <video src={f.url} controls style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }} />
                        }
                    </Box>
                ))}

                <Typography variant="body1" sx={{ mb: 1 }}>{localPost.content}</Typography>


                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); toggleLike(); }}>
                        {localPost.likedByMe
                            ? <FavoriteIcon fontSize="small" color="error" />
                            : <FavoriteBorderIcon fontSize="small" />
                        }
                    </IconButton>
                    <Typography variant="caption" sx={{ mr: 2 }}>
                        {localPost.likes}
                    </Typography>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); openPost(); }}>
                        <ChatBubbleIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ mr: 2 }}>
                        {comments.length}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                </Box>
            </Paper>


            <Dialog fullWidth maxWidth="md" open={openDialog} onClose={closePost}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={localPost.author.avatar} sx={{ bgcolor: 'grey.300' }} />
                        <Typography sx={{ fontWeight: 600 }}>{localPost.author.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            • {getRelativeTime(getPostTime())}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <IconButton size="small" onClick={toggleLike}>
                            {localPost.likedByMe
                                ? <FavoriteIcon color="error" />
                                : <FavoriteBorderIcon />
                            }
                        </IconButton>
                        <Typography sx={{ mr: 2 }}>{localPost.likes}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    <Typography sx={{ mb: 2 }}>{localPost.content}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <List sx={{ pt: 1 }}>
                        {comments.map(c => (
                            <CommentItem
                                key={c.id}
                                comment={c}
                                postId={localPost.id}
                                currentUserId={user.id}
                                onToggleLikeComment={toggleLikeComment}
                                onDeleteComment={deleteComment}
                            />
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Напишіть коментар..."
                        multiline minRows={1} maxRows={3}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                    />
                    <IconButton color="primary" disabled={!commentText.trim()} onClick={addComment}>
                        <SendIcon />
                    </IconButton>
                </DialogActions>
            </Dialog>

            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редагувати допис</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        minRows={3}
                        maxRows={8}
                        multiline
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>Скасувати</Button>
                    <Button variant="contained" onClick={saveEdit}>Зберегти</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
