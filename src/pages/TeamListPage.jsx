import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Card,
    CardContent,
    CardActions,
    Button,
    CircularProgress,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function TeamListPage() {
    const [search, setSearch] = useState('');
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        fetch('/api/teams')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.teams)) {
                    setTeams(data.teams);
                } else {
                    setError('Помилка при завантаженні команд');
                }
            })
            .catch(() => setError('Помилка зʼєднання з сервером'))
            .finally(() => setLoading(false));
    }, []);

    const filteredTeams = teams.filter((team) =>
        team.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', bgcolor: 'grey.50', minHeight: '100vh', pt: 3 }}>
            <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto' }}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Команди
                    </Typography>
                    <Button
                        variant="contained"
                        component={RouterLink}
                        to="/team/create"
                        sx={{
                            minWidth: 145,
                            fontWeight: 500,
                            borderRadius: '8px',
                            background: '#0846A7',
                            color: '#fff',
                            boxShadow: '0px 2px 8px 0px rgba(8, 70, 167, 0.08)',
                            '&:hover': {
                                background: '#063981',
                            },
                            textTransform: 'none',
                            fontSize: 15,
                            height: 38,
                            letterSpacing: '0.02em',
                            px: 2,
                        }}
                    >
                        СТВОРИТИ КОМАНДУ
                    </Button>
                </Box>
                <TextField
                    label="Пошук команди"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 3 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" sx={{ mt: 3 }}>
                        {error}
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '28px',
                            justifyContent: 'flex-start',
                            width: '100%',
                        }}
                    >
                        {filteredTeams.map((team) => (
                            <Card
                                key={team._id}
                                elevation={4}
                                sx={{
                                    width: 314,
                                    minHeight: 120,
                                    maxHeight: 138,
                                    borderRadius: '22px',
                                    p: 0,
                                    boxShadow: '0 6px 30px 0 rgba(0,0,0,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    background: '#fff'
                                }}
                            >
                                <CardContent sx={{ pb: 0.5, pt: 2, px: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: 'primary.main', mr: 1 }}>
                                            {team.name}
                                        </Typography>
                                        {team.type && (
                                            <Box
                                                sx={{
                                                    display: 'inline-block',
                                                    bgcolor: '#f5f5f5',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    color: '#222',
                                                }}
                                            >
                                                {team.type}
                                            </Box>
                                        )}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        fontSize={15}
                                        sx={{
                                            mb: 0.2,
                                            pl: 0,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            lineHeight: 1.25,
                                            minHeight: 36, // два рядки
                                        }}
                                    >
                                        {team.description}
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{
                                    px: 3,
                                    pb: 1.2,
                                    pt: 0,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="body1" fontWeight={600} sx={{ pl: 0 }}>
                                        Гравців: <span style={{ fontWeight: 400 }}>{team.members?.length || 0}</span>
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={RouterLink}
                                        to={`/team/${team._id}`}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            px: 2.5,
                                            fontWeight: 500,
                                            ml: 2,
                                        }}
                                    >
                                        Детальніше
                                    </Button>
                                </CardActions>
                            </Card>
                        ))}
                        {filteredTeams.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 1 }}>
                                Команд не знайдено.
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
