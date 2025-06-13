import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function AdminFieldsPage() {
    const { user } = useAuth();
    const [fields, setFields] = useState([]);
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState('');
    const [type, setType] = useState('5x5');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/fields')
            .then(res => res.json())
            .then(data => setFields(data.fields || []));
    }, []);

    const handleAddField = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !location || !type) {
            setError('Заповніть усі поля!');
            return;
        }

        if (!(user?.id || user?._id)) {
            setError('user.id is missing! Перезавантаж сторінку або залогінься ще раз.');
            return;
        }

        // Автоматично визначаємо кількість слотів для поля
        const timeSlots = [
            { start: "08:00", end: "10:00" }, { start: "10:00", end: "12:00" },
            { start: "12:00", end: "14:00" }, { start: "14:00", end: "16:00" },
            { start: "16:00", end: "18:00" }, { start: "18:00", end: "20:00" },
            { start: "20:00", end: "22:00" }
        ];
        const slotCount = type === '5x5' ? 10 : 22;
        const slots = [];
        for (const t of timeSlots) {
            for (let i = 0; i < slotCount; ++i) {
                slots.push({ start: t.start, end: t.end });
            }
        }

        const payload = {
            name,
            type,
            location,
            slots,
            images: image ? [image] : [],
            ownerId: user.id || user._id,
        };

        const res = await fetch('/api/fields', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            const data = await res.json();
            setFields(prev => [...prev, data.field]);
            setName('');
            setLocation('');
            setType('5x5');
            setImage('');
        } else {
            setError('Не вдалося додати поле!');
        }
    };

    const handleDeleteField = async (fieldId) => {
        if (!window.confirm('Видалити це поле?')) return;
        const res = await fetch(`/api/fields/${fieldId}`, { method: 'DELETE' });
        if (res.ok) {
            setFields(fields.filter(f => f._id !== fieldId));
        }
    };

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 5 }}>
            <Typography variant="h4" gutterBottom>Панель адміністратора</Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Додати поле</Typography>
                <form
                    onSubmit={handleAddField}
                    style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <TextField label="Назва" value={name} onChange={e => setName(e.target.value)} size="small" />
                    <TextField label="Адреса" value={location} onChange={e => setLocation(e.target.value)} size="small" />
                    <TextField
                        select
                        label="Тип"
                        value={type}
                        onChange={e => setType(e.target.value)}
                        size="small"
                        sx={{ minWidth: 110 }}
                    >
                        <MenuItem value="5x5">5 x 5 (10 слотів)</MenuItem>
                        <MenuItem value="11x11">11 x 11 (22 слоти)</MenuItem>
                    </TextField>
                    <TextField label="Фото (URL)" value={image} onChange={e => setImage(e.target.value)} size="small" />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button type="submit" variant="contained">Додати</Button>
                </form>

                {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
            </Paper>

            <Typography variant="h6" gutterBottom>Список доданих полів</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell align="center">Назва</TableCell>
                        <TableCell align="center">Адреса</TableCell>
                        <TableCell align="center">Фото</TableCell>
                        <TableCell align="center">Тип</TableCell>
                        <TableCell align="center">Слоти</TableCell>
                        <TableCell align="center"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {fields.map(field => (
                        <TableRow key={field._id}>
                            <TableCell align="center">{field.name}</TableCell>
                            <TableCell align="center">{field.location}</TableCell>
                            <TableCell align="center">
                                {field.images && field.images[0] && (
                                    <img src={field.images[0]} alt={field.name} width={60} />
                                )}
                            </TableCell>
                            <TableCell align="center">{field.type === '5x5' ? '5 x 5' : '11 x 11'}</TableCell>
                            <TableCell align="center">{field.type === '5x5' ? 10 : 22}</TableCell>
                            <TableCell align="center">
                                <Button color="error" onClick={() => handleDeleteField(field._id)}>Видалити</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

        </Box>
    );
}
