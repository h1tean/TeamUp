import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Paper
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!user?.id && !user?._id) return;
        fetch(`/api/bookings?userId=${user._id || user.id}`)
            .then(res => res.json())
            .then(data => setBookings(data.bookings || []));
    }, [user]);

    const handleCancel = async (id, bookingStartTime) => {
        const start = new Date(bookingStartTime);
        const now = new Date();
        const diffMins = (start - now) / 60000;
        if (diffMins < 60) {
            setMsg('Скасування можливе лише більше ніж за 1 годину до початку.');
            return;
        }
        if (!window.confirm('Скасувати бронювання?')) return;
        const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setBookings(bookings.filter(b => b._id !== id));
            setMsg('Бронювання скасовано');
        } else {
            setMsg('Не вдалося скасувати');
        }
    };

    const hasBookings = bookings && bookings.length > 0;

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h4" gutterBottom>Мої бронювання</Typography>
                {msg && <Typography color={msg.startsWith('Бронювання') ? 'primary' : 'error'} sx={{ mb: 2 }}>{msg}</Typography>}
                {hasBookings ? (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Поле</TableCell>
                                <TableCell>Дата</TableCell>
                                <TableCell>Час</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Дія</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.map(b => {
                                const start = new Date(b.startTime);
                                const end = new Date(b.endTime);
                                const dateStr = start.toLocaleDateString('uk-UA');
                                const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}-${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
                                const isCancelable = (start - new Date()) >= 60 * 60 * 1000;
                                return (
                                    <TableRow key={b._id}>
                                        <TableCell>{b.fieldId?.name || '–'}</TableCell>
                                        <TableCell>{dateStr}</TableCell>
                                        <TableCell>{timeStr}</TableCell>
                                        <TableCell>{b.status === 'canceled' ? 'Скасовано' : 'Активне'}</TableCell>
                                        <TableCell>
                                            {b.status !== 'canceled' && (
                                                <Button color="error"
                                                        onClick={() => handleCancel(b._id, b.startTime)}
                                                        disabled={!isCancelable}
                                                >
                                                    Скасувати
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <Typography sx={{ mt: 2 }}>У вас поки немає бронювань.</Typography>
                )}
            </Paper>
        </Box>
    );
}
