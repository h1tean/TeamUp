import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    MenuItem,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TeamEditPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        name: '',
        description: '',
        city: '',
        trainingDays: '',
        type: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        setError('');
        fetch(`/api/teams/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success || !data.team) {
                    setError('Команду не знайдено');
                } else {
                    const isOwner = data.team.members.some(
                        m =>
                            (m.userId?._id || m.userId) === user.id &&
                            m.roleInTeam === 'owner'
                    );
                    if (!isOwner) {
                        setError('Тільки власник команди може редагувати її дані.');
                    } else {
                        setForm({
                            name: data.team.name || '',
                            description: data.team.description || '',
                            city: data.team.city || '',
                            trainingDays: data.team.trainingDays || '',
                            type: data.team.type || ''
                        });
                    }
                }
            })
            .catch(() => setError('Не вдалося завантажити дані команди'))
            .finally(() => setLoading(false));
    }, [id, user.id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const { name, city, type } = form;
        if (!name || !city || !type) {
            setError('Назва, місто і формат гри обовʼязкові.');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/teams/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    city: form.city,
                    trainingDays: form.trainingDays,
                    type: form.type
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error || 'Помилка при збереженні');
            } else {
                setSuccess('Команду оновлено!');
                setTimeout(() => {
                    navigate(`/team/${id}`);
                }, 900);
            }
        } catch {
            setError('Помилка зʼєднання з сервером');
        }
        setSaving(false);
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
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                <Paper sx={{ width: 430, p: 4 }}>
                    <Typography variant="h6" align="center" color="error">
                        {error}
                    </Typography>
                    <Button sx={{ mt: 2 }} fullWidth variant="outlined" onClick={() => navigate(-1)}>
                        Назад
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
            <Paper sx={{ width: 430, p: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Редагування команди
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Назва команди"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Опис (необов'язково)"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Місто"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Дні тренувань (наприклад: Пн, Ср, Пт)"
                        name="trainingDays"
                        value={form.trainingDays}
                        onChange={handleChange}
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Формат гри"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        select
                        required
                        fullWidth
                        sx={{ mb: 3 }}
                    >
                        <MenuItem value="">Оберіть формат</MenuItem>
                        <MenuItem value="5×5">5×5</MenuItem>
                        <MenuItem value="11×11">11×11</MenuItem>
                    </TextField>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ py: 1.5, fontWeight: 600 }}
                        disabled={saving}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Зберегти'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
