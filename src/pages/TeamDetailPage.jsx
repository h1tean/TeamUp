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
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TeamDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();

    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestSent, setRequestSent] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [alreadyMember, setAlreadyMember] = useState(false);
    const [alreadyRequested, setAlreadyRequested] = useState(false);
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/teams/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.team) {
                    setTeam(data.team);
                    if (user?.id) {
                        const isMember = data.team.members.some(
                            (m) => m.userId?._id === user.id || m.userId === user.id
                        );
                        const isRequested = data.team.joinRequests.some(
                            (r) => (r._id || r) === user.id
                        );
                        setAlreadyMember(isMember);
                        setAlreadyRequested(isRequested);
                        setRequestSent(isRequested);
                    }
                } else {
                    setError('Команду не знайдено');
                }
            })
            .catch(() => setError('Не вдалося завантажити дані команди'))
            .finally(() => setLoading(false));
    }, [id, user?.id]);

    const handleJoinRequest = async () => {
        setRequestLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/teams/${id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRequestSent(true);
                setOpenSnackbar(true);
            } else {
                setError(data.error || 'Не вдалося надіслати запит');
            }
        } catch {
            setError('Помилка зʼєднання із сервером');
        }
        setRequestLoading(false);
    };

    const closeSnackbar = () => setOpenSnackbar(false);

    if (loading) {
        return (
            <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (error || !team) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4, mx: 'auto', maxWidth: 600 }}>
                <Typography variant="h5" color="error">{error || 'Команду не знайдено'}</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'background.default',
                p: 2,
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 700 }}>
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

                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        {!user?.id ? (
                            <Typography color="warning.main">Увійдіть, щоб подати запит</Typography>
                        ) : alreadyMember ? (
                            <Button variant="outlined" disabled>Ви вже у складі</Button>
                        ) : alreadyRequested || requestSent ? (
                            <Button variant="outlined" disabled>Запит надіслано</Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleJoinRequest}
                                disabled={requestLoading}
                            >
                                {requestLoading ? <CircularProgress size={22} /> : 'ПОДАТИ ЗАПИТ'}
                            </Button>
                        )}
                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                        )}
                    </Box>

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
                                    </ListItemButton>
                                </Box>
                            ))}
                        </List>
                    </Box>
                </Paper>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={closeSnackbar} severity="info" sx={{ width: '100%' }}>
                    Запит на вступ до команди надіслано!
                </Alert>
            </Snackbar>
        </Box>
    );
}
