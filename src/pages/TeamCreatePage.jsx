import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    MenuItem,
    Paper,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TeamCreatePage() {
    const { user, setUser } = useAuth();
    const [form, setForm] = useState({
        name: '',
        description: '',
        city: '',
        trainingDays: '',
        type: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

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
        if (!user?.id) {
            setError('Не вдалося визначити ваш ідентифікатор. Залогіньтесь ще раз.');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const check = await fetch('/api/teams/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const checkData = await check.json();
            if (checkData.success && checkData.team) {
                setError('Ви вже у складі команди. Щоб створити нову — покиньте поточну.');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, creatorId: user.id }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error || 'Помилка при створенні команди');
            } else {
                setSuccess('Команду створено!');
                if (setUser) {
                    setUser({
                        ...user,
                        teams: [...(user.teams || []), data.team._id]
                    });
                }
                setTimeout(() => {
                    navigate(`/team/${data.team._id}`);
                }, 900);
            }
        } catch {
            setError('Помилка зʼєднання з сервером');
        }
        setLoading(false);
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
            <Paper sx={{ width: 430, p: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Створення команди
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
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Створити'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
