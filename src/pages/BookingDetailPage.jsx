import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, MenuItem, TextField, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
    { label: '08:00-10:00', start: '08:00', end: '10:00' },
    { label: '10:00-12:00', start: '10:00', end: '12:00' },
    { label: '12:00-14:00', start: '12:00', end: '14:00' },
    { label: '14:00-16:00', start: '14:00', end: '16:00' },
    { label: '16:00-18:00', start: '16:00', end: '18:00' },
    { label: '18:00-20:00', start: '18:00', end: '20:00' },
    { label: '20:00-22:00', start: '20:00', end: '22:00' }
];

export default function BookingDetailPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useAuth();
    const [field, setField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [slot, setSlot] = useState('');
    const [busySlots, setBusySlots] = useState([]);
    const [msg, setMsg] = useState('');
    const todayStr = new Date().toISOString().slice(0, 10);
    const [myBookings, setMyBookings] = useState([]);

    useEffect(() => {
        fetch(`/api/fields/${id}`)
            .then(res => res.json())
            .then(data => {
                setField(data.field);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        function fetchBookings() {
            fetch(`/api/bookings?fieldId=${id}&date=${date}`)
                .then(res => res.json())
                .then(data => setBusySlots(data.bookings || []));
        }

        fetchBookings();
        const interval = setInterval(fetchBookings, 10000);
        return () => clearInterval(interval);
    }, [id, date]);

    useEffect(() => {
        if (!user?.id && !user?._id) return;
        fetch(`/api/bookings?fieldId=${id}&date=${date}&userId=${user._id || user.id}`)
            .then(res => res.json())
            .then(data => setMyBookings(data.bookings || []));
    }, [id, date, user]);

    if (loading) return <Typography sx={{textAlign: "center", mt: 8}}>Завантаження...</Typography>;
    if (!field) return <Typography sx={{textAlign: "center", mt: 8}}>Поле не знайдено</Typography>;

    function countBookingsForSlot(slotLabel) {
        return busySlots.filter(b => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const label = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}` +
                `-${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
            return label === slotLabel;
        }).length;
    }

    const slotCount = field.type === '11x11' ? 22 : 10;

    function userHasBookingForSlot(slotLabel) {
        return myBookings.some(b => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const label = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}` +
                `-${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
            return label === slotLabel;
        });
    }

    function isSlotDisabled(s) {
        if (date === todayStr) {
            const now = new Date();
            const [startHour, startMin] = s.start.split(':').map(Number);
            const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin, 0);
            if (slotStart < now) return true;
        }
        if (userHasBookingForSlot(s.label)) return true;
        if (countBookingsForSlot(s.label) >= slotCount) return true;
        return false;
    }

    const handleBooking = async () => {
        setMsg('');
        if (!slot || !date) {
            setMsg('Оберіть дату і час!');
            return;
        }
        if (!user?.id && !user?._id) {
            setMsg('Ви не авторизовані!');
            return;
        }
        const chosenDate = new Date(date + 'T00:00:00');
        const nowDate = new Date(todayStr + 'T00:00:00');
        if (chosenDate < nowDate) {
            setMsg('Не можна вибрати дату в минулому!');
            return;
        }
        const time = TIME_SLOTS.find(s => s.label === slot);
        if (!time) {
            setMsg('Некоректний слот!');
            return;
        }
        if (date === todayStr) {
            const now = new Date();
            const [startHour, startMin] = time.start.split(':').map(Number);
            const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin, 0);
            if (slotStart < now) {
                setMsg('Не можна забронювати минулий слот!');
                return;
            }
        }
        if (userHasBookingForSlot(slot)) {
            setMsg('Ви вже забронювали цей слот!');
            return;
        }
        const startTime = new Date(`${date}T${time.start}:00`);
        const endTime = new Date(`${date}T${time.end}:00`);

        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                fieldId: id,
                bookedByUserId: user._id || user.id,
                startTime,
                endTime
            }),
        });
        if (res.ok) {
            setMsg('Успішно заброньовано!');
            setSlot('');
            fetch(`/api/bookings?fieldId=${id}&date=${date}`)
                .then(res => res.json())
                .then(data => setBusySlots(data.bookings || []));
            fetch(`/api/bookings?fieldId=${id}&date=${date}&userId=${user._id || user.id}`)
                .then(res => res.json())
                .then(data => setMyBookings(data.bookings || []));
        } else {
            const data = await res.json();
            setMsg('Помилка: ' + (data?.error || 'Не вдалося забронювати'));
        }
    };

    return (
        <Box sx={{
            maxWidth: 460,
            mx: 'auto',
            mt: 7,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Paper elevation={6} sx={{
                width: '100%',
                borderRadius: 3,
                p: {xs: 2, sm: 3},
                boxShadow: 4,
                mb: 4
            }}>
                {field.images && field.images[0] &&
                    <Box
                        sx={{
                            width: '100%',
                            height: 140,
                            borderRadius: 2,
                            mb: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f5f5f5'
                        }}
                    >
                        <img
                            src={field.images[0]}
                            alt={field.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                    </Box>
                }

                <Typography
                    variant="h5"
                    fontWeight={700}
                    mb={0.5}
                    sx={{fontSize: 25, textAlign: 'center'}}
                >
                    {field.name}
                </Typography>
                <Typography fontSize={17} mb={1} textAlign="center">Адреса: {field.location}</Typography>
                <Typography fontSize={16} mb={2} textAlign="center">
                    Тип: {field.type === '11x11' ? '11 x 11 (22 слоти)' : '5 x 5 (10 слотів)'}
                </Typography>

                <Box sx={{mt: 1, mb: 2}}>
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <TextField
                            label="Дата"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            inputProps={{min: todayStr}}
                            sx={{flex: 1, minWidth: 135}}
                            size="small"
                        />
                        <TextField
                            label="Час"
                            select
                            value={slot}
                            onChange={e => setSlot(e.target.value)}
                            sx={{flex: 1, minWidth: 180}}
                            size="small"
                        >
                            {TIME_SLOTS.map(s => (
                                <MenuItem
                                    key={s.label}
                                    value={s.label}
                                    disabled={isSlotDisabled(s)}
                                >
                                    {s.label} — {countBookingsForSlot(s.label)}/{slotCount} зайнято
                                    {userHasBookingForSlot(s.label) ? ' (Ваша бронь)' : ''}
                                    {countBookingsForSlot(s.label) >= slotCount ? ' (Заповнено)' : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Box>
                {msg &&
                    <Typography sx={{mt: 2, textAlign: "center"}}
                                color={msg.startsWith('Успішно') ? 'primary' : 'error'}>
                        {msg}
                    </Typography>
                }

                <Stack direction="row" justifyContent="space-between" sx={{mt: 4}}>
                    <Button
                        onClick={() => navigate(-1)}
                        size="small"
                        sx={{
                            fontWeight: 500,
                            minWidth: 0,
                            alignSelf: 'flex-start'
                        }}
                    >
                        ← НАЗАД
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{
                            borderRadius: 2,
                            fontWeight: 400,
                            letterSpacing: 1,
                            minWidth: 110,
                            minHeight: 32,
                            fontSize: 15
                        }}
                        onClick={handleBooking}
                        disabled={!slot}
                    >
                        Забронювати
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}