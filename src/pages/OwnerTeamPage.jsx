import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, List, ListItemButton, ListItemText,
    Paper, Divider, IconButton, Snackbar, Alert
} from '@mui/material';
import { Star as StarIcon, Delete as DeleteIcon, Chat as ChatIcon, Edit as EditIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import TeamChatModal from '../components/TeamChatModal';

export default function OwnerTeamPage({ currentUser }) {
    const { id } = useParams(); // /team/:id
    const [team, setTeam] = useState(null);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [openTeamChat, setOpenTeamChat] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.team) setTeam(data.team);
        };
        fetchTeam();
    }, [id]);

    const closeSnackbar = () => setSnackbarOpen(false);

    const navigate = useNavigate();
    const handleEditTeam = () => navigate(`/team/${id}/edit`);

    const removeMember = (memberId, memberName) => {
        setSnackbarMessage(`Учасник ${memberName} видалений (mock).`);
        setSnackbarOpen(true);
    };

    if (!team) return <Typography sx={{ p: 3 }}>Завантаження...</Typography>;

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', backgroundColor: 'background.default', p: 2 }}>
            <Box sx={{ width: '100%', maxWidth: 700 }}>
                {/* Шапка — тільки назва */}
                <Box sx={{
                    backgroundColor: 'primary.main',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    color: '#fff',
                    textAlign: 'center',
                    py: 4,
                    boxShadow: 3,
                    position: 'relative',
                }}>
                    <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 700 }}>
                        {team.name}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ChatIcon />}
                        sx={{ flex: 1, fontWeight: 500, py: 1.5 }}
                        onClick={() => setOpenTeamChat(true)}
                    >
                        ВІДКРИТИ ЧАТ КОМАНДИ
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="warning"
                        startIcon={<EditIcon />}
                        sx={{ flex: 1, fontWeight: 500, py: 1.5 }}
                        onClick={handleEditTeam}
                    >
                        РЕДАГУВАТИ
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{ flex: 1, fontWeight: 500, py: 1.5 }}
                        // onClick={handleDeleteTeam}
                    >
                        ВИДАЛИТИ КОМАНДУ
                    </Button>
                </Box>

                <Paper elevation={3} sx={{
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    p: 3,
                    mt: -2,
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Про нас
                        </Typography>
                        <Typography variant="body1">{team.description}</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Місто
                            </Typography>
                            <Typography variant="body1">{team.city}</Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Дні тренувань
                                </Typography>
                                <Typography variant="body1">{team.trainingDays}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'right' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Формат гри
                            </Typography>
                            <Typography variant="body1">{team.type}</Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Кількість гравців
                                </Typography>
                                <Typography variant="body1">
                                    {team.members?.length || 0} / {team.maxMembers || 27}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                        Учасники
                    </Typography>
                    <Box sx={{ flex: 1, overflowY: team.members?.length > 5 ? 'auto' : 'visible' }}>
                        <List disablePadding>
                            {(team.members || []).map((m) => (
                                <Box
                                    key={m.userId?._id || m.userId || m.id}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 1,
                                        backgroundColor:
                                            m.roleInTeam === 'owner' ? 'rgba(255, 236, 179, 0.6)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <ListItemButton
                                        component={RouterLink}
                                        to={`/profile/${m.userId?._id || m.userId || m.id}`}
                                        sx={{ px: 2, py: 1.5, flexGrow: 1 }}
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
                                    {m.roleInTeam !== 'owner' && (
                                        <IconButton
                                            edge="end"
                                            color="error"
                                            sx={{ mr: 1 }}
                                            onClick={() => removeMember(m.userId?._id || m.userId, m.userId?.firstName || m.firstName)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </List>
                    </Box>
                </Paper>
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={2500}
                    onClose={closeSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={closeSnackbar} severity="info" sx={{ width: '100%' }}>
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
                {team && (
                    <TeamChatModal
                        open={openTeamChat}
                        onClose={() => setOpenTeamChat(false)}
                        teamId={team._id}
                        teamName={team.name}
                        members={team.members}
                        currentUser={currentUser}
                    />
                )}
            </Box>
        </Box>
    );
}
