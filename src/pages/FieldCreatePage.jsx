import React, { useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const timeSlots = [
    { start: "08:00", end: "10:00" }, { start: "10:00", end: "12:00" },
    { start: "12:00", end: "14:00" }, { start: "14:00", end: "16:00" },
    { start: "16:00", end: "18:00" }, { start: "18:00", end: "20:00" },
    { start: "20:00", end: "22:00" },
];

export default function FieldCreatePage() {
    const [name, setName] = useState('');
    const [type, setType] = useState('5x5');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Автоматично визначаємо кількість слотів для поля
        const slotCount = type === '5x5' ? 10 : 22;
        const slots = [];
        for (const t of timeSlots) {
            // Для кожного слоту часу — додати slotCount екземплярів
            for (let i = 0; i < slotCount; ++i) {
                slots.push({ start: t.start, end: t.end });
            }
        }

        const ownerId = user?._id || user?.id;
        if (!ownerId) {
            alert('ownerId is missing! Перезавантаж сторінку або залогінься ще раз.');
            return;
        }

        const payload = {
            name,
            type,
            location,
            slots,
            images: image ? [image] : [],
            ownerId
        };
        console.log('payload:', payload);

        const res = await fetch('/api/fields', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            navigate('/fields/admin');
        } else {
            alert('Помилка створення поля');
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: 5, p: 3, bgcolor: '#fff', borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h5" mb={2}>Додати нове поле</Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth label="Назва"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth label="Тип"
                    value={type}
                    select
                    onChange={e => setType(e.target.value)}
                    required sx={{ mb: 2 }}
                >
                    <MenuItem value="5x5">5 x 5 (10 слотів)</MenuItem>
                    <MenuItem value="11x11">11 x 11 (22 слоти)</MenuItem>
                </TextField>
                <TextField
                    fullWidth label="Адреса"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    required sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth label="Фото (URL)"
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Button type="submit" fullWidth variant="contained">
                    Створити
                </Button>
            </form>
        </Box>
    );
}
