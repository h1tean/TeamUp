import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Divider,
    CircularProgress,
    Snackbar,
    Alert,
    Stack
} from '@mui/material';
import { Star as StarIcon, Delete as DeleteIcon, Edit as EditIcon, Chat as ChatIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TeamChatModal from '../components/TeamChatModal';

export default function MyTeamPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [owner, setOwner] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [openTeamChat, setOpenTeamChat] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            setTeam(null);
            setError('Ваша сесія неактивна. Увійдіть ще раз.');
            setLoading(false);
            return;
        }
        fetch('/api/teams/my', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.team) {
                    setTeam(data.team);
                    // Чи owner (по members)
                    const isOwner = data.team.members.some(
                        m => (m.userId?._id || m.userId) === user?.id && m.roleInTeam === 'owner'
                    );
                    setOwner(isOwner);
                } else {
                    setTeam(null);
                }
            })
            .catch(() => {
                setTeam(null);
                setError('Не вдалося завантажити дані команди');
            })
            .finally(() => setLoading(false));
    }, [user]);

    const handleLeave = async () => {
        if (!window.confirm('Ви дійсно хочете покинути команду?')) return;
        setLeaveLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${team._id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSnackbarMsg('Ви покинули команду!');
                setOpenSnackbar(true);
                setTimeout(() => {
                    navigate('/team');
                }, 1000);
            } else {
                setSnackbarMsg(data.error || 'Не вдалося покинути команду');
                setOpenSnackbar(true);
            }
        } catch {
            setSnackbarMsg('Помилка зʼєднання із сервером');
            setOpenSnackbar(true);
        }
        setLeaveLoading(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Видалити команду? Всі учасники втратять членство.')) return;
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${team._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSnackbarMsg('Команду видалено!');
                setOpenSnackbar(true);
                setTimeout(() => {
                    navigate('/team');
                }, 1000);
            } else {
                setSnackbarMsg(data.error || 'Не вдалося видалити команду');
                setOpenSnackbar(true);
            }
        } catch {
            setSnackbarMsg('Помилка зʼєднання із сервером');
            setOpenSnackbar(true);
        }
        setDeleteLoading(false);
    };

    const handleOpenChat = () => {
        setOpenTeamChat(true);
    };

    const handleEdit = () => {
        navigate(`/team/${team._id}/edit`);
    };

    const handleKick = async (userId, name) => {
        if (!window.confirm(`Видалити ${name} з команди?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${team._id}/remove/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSnackbarMsg('Учасника видалено');
                setOpenSnackbar(true);
                setLoading(true);
                // Оновлюємо дані команди
                const resp = await fetch('/api/teams/my', { headers: { Authorization: `Bearer ${token}` } });
                const dat = await resp.json();
                if (dat.success && dat.team) setTeam(dat.team);
                setLoading(false);
            } else {
                setSnackbarMsg(data.error || 'Не вдалося видалити учасника');
                setOpenSnackbar(true);
            }
        } catch {
            setSnackbarMsg('Помилка зʼєднання із сервером');
            setOpenSnackbar(true);
        }
    };

    const handleApprove = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${team._id}/requests/${userId}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSnackbarMsg('Запит схвалено');
                setOpenSnackbar(true);
                setLoading(true);
                const resp = await fetch('/api/teams/my', { headers: { Authorization: `Bearer ${token}` } });
                const dat = await resp.json();
                if (dat.success && dat.team) setTeam(dat.team);
                setLoading(false);
            } else {
                setSnackbarMsg(data.error || 'Не вдалося схвалити запит');
                setOpenSnackbar(true);
            }
        } catch {
            setSnackbarMsg('Помилка зʼєднання із сервером');
            setOpenSnackbar(true);
        }
    };

    const handleReject = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${team._id}/requests/${userId}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSnackbarMsg('Запит відхилено');
                setOpenSnackbar(true);
                setLoading(true);
                const resp = await fetch('/api/teams/my', { headers: { Authorization: `Bearer ${token}` } });
                const dat = await resp.json();
                if (dat.success && dat.team) setTeam(dat.team);
                setLoading(false);
            } else {
                setSnackbarMsg(data.error || 'Не вдалося відхилити запит');
                setOpenSnackbar(true);
            }
        } catch {
            setSnackbarMsg('Помилка зʼєднання із сервером');
            setOpenSnackbar(true);
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography color="error" variant="h6">{error}</Typography>
            </Box>
        );
    }

    if (!team) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5" gutterBottom>Ви ще не у жодній команді</Typography>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        component={RouterLink}
                        to="/team/create"
                    >
                        Створити команду
                    </Button>
                    <Button
                        variant="outlined"
                        component={RouterLink}
                        to="/team"
                    >
                        Переглянути команди
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Box sx={{ width: '100%', maxWidth: 700 }}>
                {/* Заголовок */}
                <Box
                    sx={{
                        backgroundColor: 'primary.main',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        color: '#fff',
                        textAlign: 'center',
                        py: 3,
                        boxShadow: 3,
                    }}
                >
                    <Typography variant="h4">{team.name}</Typography>
                </Box>

                <Paper
                    elevation={3}
                    sx={{
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                        p: 3,
                        mt: -2,
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Про нас
                        </Typography>
                        <Typography variant="body1">{team.description || '—'}</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Місто
                            </Typography>
                            <Typography variant="body1">{team.city || '—'}</Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Дні тренувань
                                </Typography>
                                <Typography variant="body1">{team.trainingDays || '—'}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Формат гри
                            </Typography>
                            <Typography variant="body1">{team.type || '—'}</Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Кількість гравців
                                </Typography>
                                <Typography variant="body1">
                                    {team.members?.length || 0}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ mb: 2 }} justifyContent="center">
                        <Button variant="outlined" startIcon={<ChatIcon />} onClick={handleOpenChat}>
                            Відкрити чат команди
                        </Button>
                        {owner ? (
                            <>
                                <Button variant="contained" color="warning" startIcon={<EditIcon />} onClick={handleEdit}>
                                    Редагувати
                                </Button>
                                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete} disabled={deleteLoading}>
                                    {deleteLoading ? <CircularProgress size={18} /> : 'Видалити команду'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<LogoutIcon />}
                                onClick={handleLeave}
                                disabled={leaveLoading}
                            >
                                {leaveLoading ? <CircularProgress size={18} /> : 'Покинути команду'}
                            </Button>
                        )}
                    </Stack>

                    <Typography variant="h6" gutterBottom>
                        Учасники
                    </Typography>
                    <Box
                        sx={{
                            flex: 1,
                            overflowY: team.members.length > 5 ? 'auto' : 'visible',
                        }}
                    >
                        <List disablePadding>
                            {team.members.map((m) => (
                                <Box
                                    key={m.userId?._id || m.userId || m.id}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 1,
                                        backgroundColor:
                                            m.roleInTeam === 'owner' ? 'rgba(255, 236, 179, 0.6)' : 'transparent',
                                    }}
                                >
                                    <ListItemButton
                                        component={RouterLink}
                                        to={`/profile/${m.userId?._id || m.userId || m.id}`}
                                        sx={{ px: 2, py: 1.5 }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="subtitle1">
                                                        {m.userId?.firstName && m.userId?.lastName
                                                            ? m.userId.firstName + ' ' + m.userId.lastName
                                                            : m.firstName || ''}
                                                    </Typography>
                                                    {m.roleInTeam === 'owner' && (
                                                        <StarIcon color="warning" fontSize="small" />
                                                    )}
                                                </Box>
                                            }
                                        />
                                        {owner && m.roleInTeam !== 'owner' && (
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                startIcon={<DeleteIcon />}
                                                sx={{ ml: 2, minWidth: 32, px: 1 }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleKick(m.userId?._id || m.userId, m.userId?.firstName || m.firstName);
                                                }}
                                            >
                                                Видалити
                                            </Button>
                                        )}
                                    </ListItemButton>
                                </Box>
                            ))}
                        </List>
                    </Box>

                    {owner && team.joinRequests && team.joinRequests.length > 0 && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Заявки на вступ
                            </Typography>
                            <List>
                                {team.joinRequests.map(u => (
                                    <ListItemButton key={u._id || u.id}>
                                        <ListItemText
                                            primary={`${u.firstName || ''} ${u.lastName || ''}`}
                                        />
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            sx={{ mr: 1 }}
                                            onClick={() => handleApprove(u._id || u.id)}
                                        >
                                            Додати
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleReject(u._id || u.id)}
                                        >
                                            Відхилити
                                        </Button>
                                    </ListItemButton>
                                ))}
                            </List>
                        </>
                    )}

                </Paper>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenSnackbar(false)} severity="info" sx={{ width: '100%' }}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>

            <TeamChatModal
                open={openTeamChat}
                onClose={() => setOpenTeamChat(false)}
                teamId={team._id}
                teamName={team.name}
                members={team.members}
                currentUser={user}
            />
        </Box>
    );
}
